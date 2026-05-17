-- Scout AI — Explore Infinite Library tables
-- Safe to run on projects that already created these manually.

create table if not exists public.ai_fields (
  id text primary key,
  title text not null,
  description text default '',
  icon text default 'library',
  color text default '#7C3AED',
  sort_order int default 0,
  created_at timestamptz default now()
);

create table if not exists public.ai_roadmaps (
  id text primary key,
  field_id text not null references public.ai_fields(id) on delete cascade,
  title text not null,
  description text default '',
  content jsonb default '[]'::jsonb,
  is_generated boolean default false,
  created_at timestamptz default now()
);

create index if not exists ai_roadmaps_field_id_idx on public.ai_roadmaps(field_id);

alter table public.ai_fields enable row level security;
alter table public.ai_roadmaps enable row level security;

drop policy if exists "ai_fields read" on public.ai_fields;
create policy "ai_fields read" on public.ai_fields for select to anon, authenticated using (true);

drop policy if exists "ai_roadmaps read" on public.ai_roadmaps;
create policy "ai_roadmaps read" on public.ai_roadmaps for select to anon, authenticated using (true);

grant select on public.ai_fields to anon, authenticated;
grant select on public.ai_roadmaps to anon, authenticated;
