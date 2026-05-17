# Scout AI — Explore Section: Text-Based Content Discovery
**Blueprint & Next Steps**
*Last updated: May 17, 2026*

---

## What I Understand (Full Picture)

### The Core Mental Model — Netflix Architecture

Think of how Netflix works:

- The **movie title, description, genre, cast** never changes every day. It is precomputed once and served instantly from a database.
- The **"New Episodes", "Trending Now", "What's popular this week"** sections DO change — but not on every user request. They are refreshed in the background on a schedule.
- When Netflix refreshes "Trending Now", it **never shows an empty shelf** mid-refresh. The old list stays visible until the new list is completely ready, then it atomically swaps in.

**This is exactly what you're describing for Explore.**

---

### Two-Layer Data Model

#### Layer 1 — Static Precomputed Layer (Topic Definitions)
This is the "movie title + description" equivalent. For any AI topic the user might explore:

- What is this topic? (definition, overview)
- What field does it belong to?
- What are the key concepts?
- What is the official documentation URL?
- What difficulty level is it?

This data **does not change frequently**. It is precomputed once (or very rarely updated) for a large corpus of AI topics — every common term, framework, model, concept in the AI landscape. Think ~500–1000+ entries covering everything from "Linear Regression" to "Mixture of Experts" to "RLHF".

**Seeding strategy:** Run a one-time Gemini-powered job that generates structured definitions for the full AI topic corpus and stores them in Supabase. This is the foundation.

#### Layer 2 — Dynamic Content Layer (Articles, Papers, News, Posts)
This is the "Trending Now" equivalent. For each topic:

- Latest articles and blog posts
- Recent research papers (ArXiv, Semantic Scholar)
- Industry news and market updates
- Community posts (Dev.to, Hacker News)

This data **changes daily**. It is refreshed by a **cron job that runs 1–2 times per day**. The cron job fetches fresh content from external sources, stores it in the DB, and only removes the old content after the new content is confirmed ready.

**Critical rule: old content is never deleted until new content is fully ready.** Zero empty states, zero broken feeds during refresh.

---

### Search Bar Behavior (DB-First, Not Live API)

The search bar in the Explore section queries **our own Supabase database**, not external APIs in real time. This means:

```
User types "Transformers" → hit our DB → return matching topics + their content
```

Not:
```
User types "Transformers" → call ArXiv API live → wait → show results (bad)
```

This gives sub-100ms search response times. The content is already in our DB, pre-fetched and indexed. The search bar finds topics by name, tags, field, description — anything we've precomputed.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        SUPABASE DB                          │
│                                                             │
│  explore_topics (STATIC — seeded once, rarely changes)      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ id │ title │ field │ desc │ tags │ docs_url │ diff  │   │
│  │ .. │ "CNN" │ "CV"  │ "..."│ [...] │ "tf.org" │ "Int"│   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  topic_content (DYNAMIC — cron refreshed 1–2x per day)     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ id │ topic_id │ type     │ title │ url │ source │ ts │  │
│  │ .. │ "cnn-01" │"research"│ "..." │ "." │"arxiv" │ . │  │
│  │ .. │ "cnn-01" │"article" │ "..." │ "." │"devto" │ . │  │
│  │ .. │ "cnn-01" │"news"    │ "..." │ "." │"hn"    │ . │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
         ▲                              ▲
         │ seed once                   │ cron job (1–2x/day)
         │                             │
  ┌──────────────┐            ┌────────────────────┐
  │ Seed Script  │            │ Supabase Scheduled │
  │ (Gemini-     │            │ Edge Function /    │
  │  powered,    │            │ pg_cron job        │
  │  run once)   │            │                    │
  └──────────────┘            │ fetch → stage →    │
                              │ verify → swap       │
                              └────────────────────┘
                                         ▲
                              Dev.to, ArXiv, Semantic Scholar,
                              Hacker News, NewsAPI, PapersWithCode

         ▼ (read path — all from DB, zero live API calls)
┌─────────────────────────────────────────────────────────────┐
│                      MOBILE APP (React Native)              │
│                                                             │
│  ExploreScreen (root → subfield → roadmap → topic-detail)  │
│                                                             │
│  Search bar → queries explore_topics table (text search)   │
│                                                             │
│  Topic Detail Page:                                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ [STATIC ZONE — always instant]                        │  │
│  │  Topic name, definition, field, difficulty, docs link │  │
│  │                                                        │  │
│  │ [DYNAMIC ZONE — from topic_content, tabs]             │  │
│  │  Articles | Research | News | Posts                   │  │
│  │  (refreshed by cron, reads from DB, never live API)   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Table: `explore_topics` (Static Layer)
```sql
create table explore_topics (
  id           text primary key,        -- e.g. "transformer-architecture"
  title        text not null,           -- "Transformer Architecture"
  field        text,                    -- "Natural Language Processing"
  field_id     text,                    -- FK to roadmap fields
  description  text,                    -- Full definition / overview
  short_desc   text,                    -- One-liner for cards
  tags         text[],                  -- ["attention", "nlp", "encoder-decoder"]
  difficulty   text,                    -- "Beginner" | "Intermediate" | "Advanced"
  docs_url     text,                    -- Official documentation URL
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
```

### Table: `topic_content` (Dynamic Layer)
```sql
create table topic_content (
  id           text primary key,        -- "{source}-{hash}"
  topic_id     text references explore_topics(id),
  type         text not null,           -- "article" | "research" | "news" | "post"
  title        text not null,
  summary      text,
  source_url   text not null,
  source_name  text,                    -- "ArXiv", "Dev.to", "Hacker News"
  category     text,
  category_color text,
  published_at timestamptz,
  fetched_at   timestamptz default now(),
  is_staging   boolean default false,  -- true while cron is building next batch
  batch_id     text                    -- cron run ID for atomic swap
);
```

> The `is_staging` + `batch_id` columns are the key to the atomic swap. The cron job inserts new rows with `is_staging = true`. After the full batch is verified, it flips all to `is_staging = false` and deletes the old batch in a single transaction. Users always see the last confirmed batch — never an empty state.

---

## Seeding Strategy (One-Time Bootstrap)

We need to precompute the AI topic corpus. Target: **500–800 topics** covering:

- Core ML/AI concepts (Linear Regression, Backpropagation, Attention, etc.)
- Architectures (ResNet, BERT, GPT, Diffusion, VAE, GAN, etc.)
- Frameworks & tools (PyTorch, TensorFlow, LangChain, HuggingFace, etc.)
- Research areas (Computer Vision, NLP, RL, Robotics, Multimodal, etc.)
- Industry topics (RAG, Fine-tuning, Quantization, RLHF, etc.)
- Emerging topics (Agents, MoE, Test-time compute, etc.)

**Seeding process:**
1. Maintain a master list of topic titles (can be a JSON file or spreadsheet)
2. Run a one-time Gemini-powered seeding script that for each topic generates:
   - Full description, short description
   - Tags, difficulty level
   - Official docs URL
3. Bulk insert into `explore_topics`
4. Immediately after, run first content fetch for all topics (populates `topic_content`)

This seed script runs **once** (or manually triggered when we add new topics to the corpus). It is not part of the cron job.

---

## Cron Job Design (Daily Content Refresh)

**Runs:** 1–2 times per day (e.g., 6 AM and 6 PM UTC)
**Implemented as:** Supabase `pg_cron` extension OR a scheduled Supabase Edge Function

### Refresh Flow (Atomic Swap Pattern)

```
1. Generate a new batch_id (e.g., UUID + timestamp)

2. For each topic in explore_topics:
   a. Fan out to content sources (Dev.to, ArXiv, Semantic Scholar, HN, NewsAPI)
   b. Normalize results into topic_content shape
   c. INSERT all new rows with is_staging = true, batch_id = new_batch_id

3. Verify the batch:
   - Count rows per topic — if any topic has 0 new items, keep its old content
   - Check for broken URLs or empty titles
   - Confirm batch is healthy

4. ATOMIC SWAP (single transaction):
   BEGIN;
     UPDATE topic_content SET is_staging = false
       WHERE batch_id = new_batch_id;
     DELETE FROM topic_content
       WHERE is_staging = false
       AND batch_id != new_batch_id;
   COMMIT;

5. Log cron run result to a cron_runs table
```

**Result:** Users always read from `is_staging = false` rows. During a cron run (step 1–3), they see the previous batch. At step 4, they instantly see the new batch. Zero empty states.

---

## Content Sources for Cron Fetches

| Source | Content Type | API Key Needed | Free Limit |
|---|---|---|---|
| **Dev.to** | Articles | No | Unlimited |
| **Hacker News (Algolia)** | Posts, discussions | No | Unlimited |
| **ArXiv** | Research papers | No | Unlimited |
| **Semantic Scholar** | Research papers | No | 100 req/5min |
| **PapersWithCode** | Papers + benchmarks | No | Unlimited |
| **Medium RSS** | Blog articles | No | Unlimited |
| **NewsAPI.org** | Industry news | Yes (free tier) | 100 req/day |
| **GNews.io** | Market updates | Yes (free tier) | 100 req/day |

> **Stage 1 plan:** Use only no-key sources (Dev.to, HN, ArXiv, Semantic Scholar, PapersWithCode). These alone cover articles, research, and community content well. Add NewsAPI/GNews when we have keys ready.

---

## What Changes in the App (UI)

### Explore Screen — Search Bar
Currently: search does nothing (`console.log`)
**After:** Queries `explore_topics` table full-text search → returns matching topics → shows them in a list → user taps → goes to topic detail

### Explore Screen — Roadmap Cards
Currently: YouTube button → external browser
**After:** "Read & Explore" button → pushes `topic-content` level in the drill-down stack

### New: Topic Detail View (`level: 'topic-content'`)
```
┌─────────────────────────────────────────┐
│  ← Transformer Architecture    [★ Save] │
├─────────────────────────────────────────┤
│  STATIC ZONE (always instant)           │
│  ┌───────────────────────────────────┐  │
│  │ Natural Language Processing       │  │
│  │ Intermediate  •  Official Docs ↗  │  │
│  │                                   │  │
│  │ "The transformer is a neural      │  │
│  │  network architecture that..."    │  │
│  └───────────────────────────────────┘  │
├─────────────────────────────────────────┤
│  DYNAMIC ZONE (tabs)                    │
│  [Articles] [Research] [News] [Posts]   │
│  ┌───────────────────────────────────┐  │
│  │ 📄 Attention Is All You Need      │  │
│  │    ArXiv · 2 days ago        [🔖] │  │
│  ├───────────────────────────────────┤  │
│  │ 📝 How Transformers Work in 2026  │  │
│  │    Dev.to · 5 hours ago      [🔖] │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## Revised Next Steps (Updated Order)

### Step 1 — Database Setup
- Create `explore_topics` table in Supabase
- Create `topic_content` table with `is_staging` + `batch_id` columns
- Create indexes on `topic_id`, `type`, `is_staging`, and full-text search on `explore_topics.title + tags`

### Step 2 — Build Seed Script
- Create a master topic list (500–800 AI terms)
- Build a Gemini-powered seed script that generates structured definitions for each
- Run it once → `explore_topics` table is populated

### Step 3 — Build `fetch-topic-content` Supabase Edge Function
- Accepts `{ topic_ids[], batch_id }` — fetches content for a list of topics
- Fans out to Dev.to, ArXiv, Semantic Scholar, Hacker News
- Inserts results as `is_staging = true`
- Can be called by cron job OR the seed script (for initial content population)

### Step 4 — Set Up Cron Job
- Supabase `pg_cron` schedule: `0 6,18 * * *` (6 AM and 6 PM UTC)
- Calls `fetch-topic-content` for all active topics
- Executes atomic swap after batch is verified

### Step 5 — Update `ExploreScreen.js`
- Wire search bar to query `explore_topics` table
- Add `topic-content` level to navigation stack
- Replace YouTube button with "Read & Explore"
- Build `renderTopicContent()` with static zone + dynamic tabs

### Step 6 — Wire Backend Services
- Add `searchTopics(query)` to `supabaseBackend.js`
- Add `fetchTopicDetail(topicId)` — returns static + dynamic content
- Update `localBackend.js` as fallback

### Step 7 — Polish & Test
- Verify search relevance across diverse queries
- Confirm atomic swap works (no empty states)
- Test bookmarking on topic-content cards
- Validate cron schedule and batch health checks

---

## Summary Table

| Concern | Decision |
|---|---|
| Search bar behavior | Queries our DB — zero live API calls |
| Static content (definitions, docs) | Precomputed once via seed script, rarely changes |
| Dynamic content (articles, papers, news) | Cron-refreshed 1–2x per day, stored in DB |
| Empty state protection | Atomic swap — old content lives until new batch is verified |
| Seeding scope | 500–800 AI topics (the full generic + advanced corpus) |
| Cron implementation | Supabase pg_cron or scheduled Edge Function |
| Content sources (Stage 1) | Dev.to, ArXiv, Semantic Scholar, HN — all zero API key |
| Content sources (later) | NewsAPI, GNews for market news |
| YouTube resources | Preserved as future "Videos" tab, not deleted |
| App stack levels | root → subfield → roadmap → topic-content (NEW) |
