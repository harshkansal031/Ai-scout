create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  name text not null default '',
  role text not null default 'Builder',
  role_color text not null default '#059669',
  skill_level text not null default 'Intermediate',
  interests text[] not null default '{}',
  topics_count integer not null default 0,
  saved_count integer not null default 0,
  streak_count integer not null default 0,
  progress_percent integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  theme_mode text not null default 'light',
  notification_preferences jsonb not null default '{"dailyTopic": true, "breakingNews": true, "papers": true}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.daily_topics (
  id text primary key,
  slug text unique not null,
  title text not null,
  tag text,
  duration_minutes integer not null default 30,
  difficulty text not null default 'Intermediate',
  description text not null default '',
  builder_takeaway text not null default '',
  content_blocks jsonb not null default '{}'::jsonb,
  publish_date date not null default current_date,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  topic_id text not null references public.daily_topics(id) on delete cascade,
  type text not null default 'article',
  title text not null,
  url text,
  duration_label text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.content_items (
  id text primary key,
  type text not null,
  title text not null,
  summary text not null default '',
  source_name text not null default '',
  source_url text not null default '',
  canonical_url text,
  published_at timestamptz,
  tags text[] not null default '{}',
  external_id text,
  topic_slug text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists content_items_canonical_url_idx on public.content_items(canonical_url) where canonical_url is not null;
create unique index if not exists content_items_external_id_idx on public.content_items(external_id) where external_id is not null;

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  content_id text not null,
  content_type text not null default 'topic',
  created_at timestamptz not null default now(),
  unique(user_id, content_id)
);

create table if not exists public.user_progress (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  weekly_percent integer not null default 0,
  topics_completed integer not null default 0,
  topics_total integer not null default 7,
  week_days boolean[] not null default '{false,false,false,false,false,false,false}',
  streak integer not null default 0,
  completed_topic_ids text[] not null default '{}',
  continue_learning jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.progress_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  topic_id text not null,
  title text not null,
  completed_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  page_context_type text not null,
  page_context_id text,
  query text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  role text not null,
  text text not null,
  citations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  token text not null,
  platform text default 'expo',
  created_at timestamptz not null default now(),
  unique(user_id, token)
);

create or replace view public.bookmarks_view as
select
  b.id as bookmark_id,
  b.user_id,
  c.id,
  c.type,
  c.title,
  c.summary,
  c.source_name,
  c.source_url,
  c.published_at,
  c.tags,
  c.metadata,
  true as saved
from public.bookmarks b
join public.content_items c on c.id = b.content_id;

create or replace view public.progress_history_view as
select
  h.id as history_id,
  h.user_id,
  h.topic_id as id,
  h.title,
  'Topic'::text as type,
  to_char(h.completed_at, 'Mon DD, YYYY') as completed_at,
  h.metadata
from public.progress_history h;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;

  insert into public.user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.user_progress (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.mark_topic_complete(p_user_id uuid, p_topic_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_ids text[];
  topic_title text;
begin
  select completed_topic_ids into existing_ids
  from public.user_progress
  where user_id = p_user_id;

  if existing_ids is null then
    existing_ids := '{}';
  end if;

  if not (p_topic_id = any(existing_ids)) then
    select title into topic_title from public.daily_topics where id = p_topic_id;

    update public.user_progress
    set
      completed_topic_ids = array_append(completed_topic_ids, p_topic_id),
      topics_completed = topics_completed + 1,
      weekly_percent = least(100, weekly_percent + 8),
      streak = streak + 1,
      updated_at = now()
    where user_id = p_user_id;

    insert into public.progress_history (user_id, topic_id, title)
    values (p_user_id, p_topic_id, coalesce(topic_title, p_topic_id));

    update public.profiles
    set
      topics_count = topics_count + 1,
      streak_count = streak_count + 1,
      progress_percent = least(100, progress_percent + 8),
      updated_at = now()
    where id = p_user_id;
  end if;
end;
$$;

alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.bookmarks enable row level security;
alter table public.user_progress enable row level security;
alter table public.progress_history enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.device_tokens enable row level security;

do $$
begin
  create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
  create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
  create policy "preferences_rw_own" on public.user_preferences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  create policy "bookmarks_rw_own" on public.bookmarks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  create policy "progress_rw_own" on public.user_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  create policy "history_select_own" on public.progress_history for select using (auth.uid() = user_id);
  create policy "chat_sessions_rw_own" on public.chat_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  create policy "chat_messages_rw_own" on public.chat_messages for all using (
    exists (
      select 1 from public.chat_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.chat_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );
  create policy "device_tokens_rw_own" on public.device_tokens for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception
  when duplicate_object then null;
end $$;

grant select on public.daily_topics to anon, authenticated;
grant select on public.resources to anon, authenticated;
grant select on public.content_items to anon, authenticated;
grant select on public.bookmarks_view to authenticated;
grant select on public.progress_history_view to authenticated;
