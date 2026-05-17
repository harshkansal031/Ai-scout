-- ============================================================
-- Scout AI — Explore Topics corpus + Topic Content tables
-- Run this in the Supabase SQL Editor after 004_ai_library.sql
-- ============================================================

create extension if not exists pg_trgm;

-- ── explore_topics: Precomputed AI topic corpus (seeded once, rarely changes) ─
create table if not exists public.explore_topics (
  id           text primary key,                        -- e.g. "transformer-architecture"
  title        text not null,                           -- "Transformer Architecture"
  field        text not null default '',                -- "Natural Language Processing"
  field_slug   text not null default '',                -- "nlp" (for filtering/grouping)
  description  text not null default '',                -- Full definition / overview
  short_desc   text not null default '',                -- One-liner for search result cards
  tags         text[] not null default '{}',            -- ["attention", "nlp", "encoder"]
  difficulty   text not null default 'Intermediate',    -- "Beginner" | "Intermediate" | "Advanced"
  docs_url     text,                                    -- Official documentation URL
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Trigram index for fast ILIKE / full-text search on title
create index if not exists explore_topics_title_trgm_idx
  on public.explore_topics using gin (title gin_trgm_ops);

-- GIN index for tag-array contains queries
create index if not exists explore_topics_tags_gin_idx
  on public.explore_topics using gin (tags);

create index if not exists explore_topics_field_slug_idx
  on public.explore_topics (field_slug);

-- ── topic_content: Dynamic content per topic (cron-refreshed 1-2x per day) ───
-- Uses atomic-swap pattern: new batch inserts with is_staging=true,
-- then a single transaction promotes new rows and removes old ones.
create table if not exists public.topic_content (
  id             text primary key,              -- "{source}-{hash}-{topic_id}"
  topic_id       text not null references public.explore_topics(id) on delete cascade,
  type           text not null,                 -- 'article' | 'research' | 'post' | 'news'
  title          text not null,
  summary        text not null default '',
  source_url     text not null,
  source_name    text not null default '',
  category       text not null default '',
  category_color text not null default '#0891B2',
  published_at   timestamptz,
  fetched_at     timestamptz not null default now(),
  is_staging     boolean not null default false,  -- true during cron build phase
  batch_id       text,                            -- cron run UUID for atomic swap
  metadata       jsonb not null default '{}'::jsonb
);

create index if not exists topic_content_topic_id_idx
  on public.topic_content (topic_id);

create index if not exists topic_content_type_idx
  on public.topic_content (topic_id, type);

create index if not exists topic_content_staging_idx
  on public.topic_content (is_staging, batch_id);

create index if not exists topic_content_published_idx
  on public.topic_content (published_at desc);

-- ── cron_runs: Log of cron job executions (for monitoring) ───────────────────
create table if not exists public.cron_runs (
  id               uuid primary key default gen_random_uuid(),
  job_name         text not null,
  batch_id         text,
  status           text not null default 'running',  -- 'running' | 'success' | 'failed'
  topics_processed integer not null default 0,
  items_inserted   integer not null default 0,
  error_message    text,
  started_at       timestamptz not null default now(),
  finished_at      timestamptz
);

-- ── Atomic swap RPC ───────────────────────────────────────────────────────────
-- Called by the fetch-topic-content edge function after a full batch completes.
-- Promotes new staging rows → live, then deletes all old live rows in one tx.
create or replace function public.swap_topic_content_batch(p_batch_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  promoted_count integer;
  deleted_count  integer;
begin
  -- 1. Count how many new rows are ready
  select count(*) into promoted_count
  from public.topic_content
  where batch_id = p_batch_id and is_staging = true;

  if promoted_count = 0 then
    return jsonb_build_object('promoted', 0, 'deleted', 0, 'error', 'batch has no staging rows');
  end if;

  -- 2. Mark new batch as live
  update public.topic_content
  set is_staging = false
  where batch_id = p_batch_id and is_staging = true;

  -- 3. Delete all OLD live rows only for topics included in this batch
  delete from public.topic_content
  where is_staging = false
    and topic_id in (
      select distinct topic_id
      from public.topic_content
      where batch_id = p_batch_id
    )
    and (batch_id is null or batch_id != p_batch_id);

  get diagnostics deleted_count = row_count;

  return jsonb_build_object('promoted', promoted_count, 'deleted', deleted_count);
end;
$$;

-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table public.explore_topics enable row level security;
alter table public.topic_content   enable row level security;

drop policy if exists "explore_topics_read" on public.explore_topics;
create policy "explore_topics_read" on public.explore_topics
  for select to anon, authenticated using (true);

-- Users only see confirmed (non-staging) content
drop policy if exists "topic_content_read" on public.topic_content;
create policy "topic_content_read" on public.topic_content
  for select to anon, authenticated using (is_staging = false);

grant select on public.explore_topics to anon, authenticated;
grant select on public.topic_content   to anon, authenticated;
grant execute on function public.swap_topic_content_batch(text) to service_role;
