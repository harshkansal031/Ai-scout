# Explore overhaul — what you see vs what runs in the background

## Two different empty states

| What you see | Meaning | Background job? |
|--------------|---------|-----------------|
| **"Lesson steps are being prepared…"** | The **roadmap** (`ai_roadmaps.content`) has no steps yet. `generate-roadmap` must run (Gemini). | Not `topic_content`. Tap subfield again or wait for roadmap generation. |
| **"No content found…" / assembling spinner** | The **Read & Explore** feed (`topic_content`) has no rows for that topic. | On-demand crawl runs **while you wait** (2–5s), not hours later. Cron only **backfills** the rest. |

Waiting before opening the app does **not** fix roadmap-empty steps. It only helps if `topic_content` was never filled for those topic ids.

---

## Why some topics had no content (root causes)

1. **ID mismatch** — Roadmap cards used `slugify(step title)` (e.g. `introduction-to-cnns`). The seeded corpus often uses different ids (e.g. `cnn`). On-demand crawl returned **"No topics found"** and nothing was stored.
2. **Partial cron** — `run_all` processes **60 random topics per run** (gateway limit). With ~490 topics, most are not refreshed until many cron cycles or a per-topic crawl.
3. **APIs return zero** — For niche titles, Dev.to / arXiv / HN may return nothing even when crawl succeeds.
4. **Seed never finished for all fields** — Early fields are enriched; later fields may be fallback-only until Gemini quota resets.

---

## Fixes applied (code)

- **`resolveExploreTopicId`** — Match by id, exact title, then fuzzy title before loading/crawling.
- **`fetch-topic-content`** — Accepts `topic_title`; creates a minimal `explore_topics` row for roadmap-only titles; promotes staging to live for single-topic crawls.
- **`triggerTopicCrawl`** — Returns `{ ok, itemsInserted }` so the UI only re-fetches when something was actually inserted.
- **Clearer empty copy** — Distinguishes “sources returned nothing” from “come back after cron”.

Redeploy after pulling:

```bash
npx supabase functions deploy fetch-topic-content --no-verify-jwt
```

---

## What runs in the background vs at tap time

| Job | When | What it does |
|-----|------|----------------|
| **Cron** (`fetch-topic-content` 6:00 & 18:00 UTC) | Twice daily | Refreshes **~60 topics per run** (shuffled). Not all topics every time. |
| **On tap (Read & Explore)** | When `topic_content` is empty | Crawls **that one topic**, promotes to live, UI awaits ~2–5s. |
| **Seed script** | Manual once | Fills `explore_topics`; may invoke `run_all` (can timeout on full corpus). |

**Runtime expectation:** First open of a topic should fill content in a few seconds via on-demand crawl. You do **not** need to wait hours unless cron is the only path (broken id / crawl returned 0).

---

## Pre-fill everything (optional, for “always instant”)

Run on-demand crawl in batches (avoids 150s gateway limit):

```sql
-- See which topics have no live content
select t.id, t.title
from explore_topics t
left join topic_content c on c.topic_id = t.id and c.is_staging = false
where c.id is null
limit 20;
```

Then invoke the edge function per id (or a small Node loop) with `{ "topic_id": "..." }` — not `{ "run_all": true }` for the full set in one HTTP call.

---

## Verify in Supabase

```sql
select count(*) as topics from explore_topics;
select count(distinct topic_id) as topics_with_content
from topic_content where is_staging = false;
```

If `topics_with_content` ≪ `topics`, cron + on-demand crawls are still catching up — not a stuck background job in the app.
