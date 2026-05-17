# Scout AI — Explore overhaul: status & next steps

**Last updated:** May 17, 2026

This document summarizes the product direction, what was built, how far it is done, gaps, and a concrete checklist for what to do next.

---

## 1. What we set out to do

We shifted the **Explore** experience from **YouTube search links** on roadmap steps toward a **text-first** discovery model (similar in spirit to the News section):

- **Stable / precomputed layer:** Large corpus of AI topics (definitions, field, difficulty, optional official docs URL) stored in the database so search and navigation feel instant.
- **Dynamic layer:** Articles, papers, posts, and news **per topic**, refreshed on a schedule (cron), with an **atomic swap** so users never see an empty feed mid-refresh—old rows stay until the new batch is promoted.
- **Search bar:** DB-first: query `explore_topics` plus existing `content_items` (and `daily_topics`), not live calls to external APIs on every keystroke.
- **YouTube:** Deprioritized for this phase; roadmap prompts moved toward **official documentation URLs** where possible.

---

## 2. Architecture (high level)

| Piece | Role |
|--------|------|
| `explore_topics` | Static-ish topic corpus (title, field, descriptions, tags, difficulty, `docs_url`). Seeded by `scripts/seed_explore_topics.js`. |
| `topic_content` | Per-topic dynamic items (`article`, `research`, `post`, …). Written by edge function with `is_staging` + `batch_id`; promoted via `swap_topic_content_batch`. |
| `cron_runs` | Optional log of fetch runs. |
| `explore-search` | Edge function: merges DB search across explore corpus + content + daily topics. |
| `fetch-topic-content` | Edge function: pulls from Dev.to, arXiv, Semantic Scholar, Hacker News, Papers With Code; staging + atomic swap on full `run_all`. |
| `generate-roadmap` | Still generates roadmap steps; prompt updated for docs URLs instead of YouTube search URLs. |
| `ExploreScreen.js` | Search, roadmap drill-down, **Read & Explore** topic view with tabs (feeds currently driven by **search**, not `topic_content` yet—see gaps). |

---

## 3. What is done (in the repo)

- **Migrations**
  - `supabase/migrations/005_explore_topics.sql` — tables, indexes, RLS, `swap_topic_content_batch` RPC.
  - `supabase/migrations/006_topic_content_cron.sql` — schedules twice-daily `fetch-topic-content` (requires `pg_cron` + `pg_net` + vault secrets like your existing `ingest-feed` job).
- **Edge functions (code + prior deploy session)**
  - `fetch-topic-content`
  - `explore-search` (updated to include `explore_topics`)
  - `generate-roadmap` + shared `roadmapUrls` sanitization (strip YouTube; prefer real HTTPS doc links).
- **App**
  - `screens/ExploreScreen.js` — search results, roadmap, **Read & Explore** with static zone + **Latest Content** tabs.
  - `services/supabaseBackend.js` — `searchExploreContent`, `fetchTopicContent` (DB read from `topic_content`).
  - `services/createLocalBackend.js` — `searchExploreContent` / `fetchTopicContent` stubs for offline demo.
- **Seeding**
  - `scripts/seed_explore_topics.js` — ~13 fields, ~490 topic titles; tries **Gemini** enrichment per field; **skips already-seeded `field_slug`s**; on failure or quota, **local fallback** metadata; invokes `fetch-topic-content` with `run_all` at the end.
  - `.env` supports `SUPABASE_SERVICE_ROLE_KEY` for the script; loads from project `.env` without extra packages.

---

## 4. How much is done (runtime / data)

**You should treat row counts as the source of truth** in Supabase (SQL Editor):

```sql
select count(*) from public.explore_topics;
select count(*) from public.topic_content where is_staging = false;
```

**What happened during development (known timeline):**

- First successful seed batch inserted **188 topics** (four fields) and triggered an initial fetch reporting **~459** items inserted (per script output).
- Later runs hit **Gemini API quota** (shared with other features using the same key, e.g. hourly ingest / roadmap).
- Script was updated with retries, longer waits, model switch attempts, and finally **instant fallback to basic metadata** when Gemini returns quota or unsupported model errors, so **remaining fields could still be upserted** without blocking.
- Terminal logs showed `gemini-1.5-flash` returning “not found for API version v1beta” for some calls—those paths fell through to **local fallback**, so topics exist but may lack Gemini-quality descriptions and `docs_url`.

**Implication:** The corpus may now be **complete by count** (~490 rows) with a mix of **Gemini-enriched** rows (early fields) and **fallback** rows (later fields). Confirm with the SQL counts above.

---

## 5. What is *not* done or is incomplete

| Gap | Detail |
|-----|--------|
| **Topic detail feed vs `topic_content`** | `fetchTopicContent(topicId)` exists in the backend but **`ExploreScreen` only calls `searchExploreContent(topicTitle)`** for the dynamic list. Precomputed `topic_content` rows are **not** the primary source in the UI yet. |
| **Cron job in production** | `006_topic_content_cron.sql` must be applied and vault secrets (`supabase_url`, `supabase_service_role_key`) must match how `003_cron_schedule.sql` is set up. If vault entries differ, scheduled refresh will not run. |
| **Gemini seed quality** | Quota/model issues mean many topics may still have **generic fallback** text. A future pass should re-run the seed (or a small “re-enrich” script) when quota is healthy, using a **correct model id** for your API version. |
| **NewsAPI / paid tiers** | Not integrated; optional for richer “market news” per topic. |
| **YouTube / video tab** | Intentionally deferred; roadmap no longer centers on YouTube search URLs. |

---

## 6. What to do next (recommended order)

### A. Verify database and cron (5–10 minutes)

1. In Supabase **SQL Editor**, confirm migrations ran: `005` and `006`.
2. Run the count queries in section 4.
3. In **Database → Cron** (or `cron.job`), confirm `fetch-topic-content-morning` / `evening` exist and recent `cron_runs` rows show `success` when expected.

### B. Wire `topic_content` into Explore (product-critical)

1. When opening **Read & Explore**, resolve the **stable topic id** from `explore_topics` (from search selection or by matching title/slug).
2. Call `backend.fetchTopicContent(topicId)` for the tabbed list (optionally merge with `searchExploreContent` for global news overlap if you want).
3. Keep **search** for the search bar and for bootstrapping when no `topic_id` is available.

### C. Fix Gemini usage for enrichment (when ready)

1. Align **model name** with [Google’s current list](https://ai.google.dev/gemini-api/docs/models) (e.g. ensure the string matches what `v1beta` accepts for your project).
2. Re-run `node scripts/seed_explore_topics.js` after quota reset—or add a **“re-enrich only fallback rows”** mode so you do not re-pay for already-rich rows.
3. Consider a **separate API key** for batch seeding vs. interactive features to avoid starving `ingest-feed`.

### D. Operational hardening

1. Monitor `cron_runs` for failures; alert if `fetch-topic-content` errors.
2. If `fetch-topic-content` is heavy on ~500 topics, consider **batching** (e.g. 50 topic IDs per run) or staggering cron frequency until costs/latency are acceptable.

### E. Product polish (optional)

1. Bookmarks on explore content items (reuse News bookmark patterns if IDs align with `content_items`—may need a consistent strategy for `topic_content` ids).
2. Empty states and “last updated” hints from `topic_content.fetched_at` or cron log.

---

## 7. Quick reference commands

```bash
# Seed / refresh explore topics (reads .env in project root)
node scripts/seed_explore_topics.js

# Deploy edge functions (from project root, if CLI linked)
npx supabase functions deploy fetch-topic-content --no-verify-jwt
npx supabase functions deploy explore-search --no-verify-jwt
npx supabase functions deploy generate-roadmap --no-verify-jwt
```

---

## 8. One-line summary

**Done:** DB schema, atomic swap pattern, fetch + search edge functions, updated roadmap generation, Explore UI with search and Read & Explore, seed pipeline with offline fallback.

**Left:** Confirm production data counts and cron; **connect the topic detail UI to `topic_content`**; re-enrich topics with Gemini when quota/model are stable; optional news APIs and polish.

This file is the handoff checklist for the Explore “Netflix-style” text content track.
