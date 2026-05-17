-- Fix bookmarks_view to left-join content_items, explore_topics, and daily_topics so that topic bookmarks are not filtered out by inner joins.
create or replace view public.bookmarks_view as
select
  b.id as bookmark_id,
  b.user_id,
  b.content_id as id,
  coalesce(c.type, b.content_type, 'topic') as type,
  coalesce(c.title, t.title, dt.title, 'AI Topic') as title,
  coalesce(c.summary, t.description, t.short_desc, dt.description, '') as summary,
  coalesce(c.source_name, 'Scout AI') as source_name,
  coalesce(c.source_url, t.docs_url, '') as source_url,
  coalesce(c.published_at, t.created_at, dt.created_at) as published_at,
  coalesce(c.tags, t.tags, '{}'::text[]) as tags,
  coalesce(c.metadata, jsonb_build_object('difficulty', coalesce(t.difficulty, dt.difficulty))) as metadata,
  true as saved
from public.bookmarks b
left join public.content_items c on c.id = b.content_id and b.content_type != 'topic'
left join public.explore_topics t on t.id = b.content_id and b.content_type = 'topic'
left join public.daily_topics dt on dt.id = b.content_id and b.content_type = 'topic';
