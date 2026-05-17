-- ============================================================
-- AI Scout — Migration 010: Upcoming Events & Event Reminders
-- ============================================================

-- Create upcoming_events table
create table if not exists public.upcoming_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_date timestamptz not null,
  location text,
  organizer text,
  category text not null, -- 'Google' | 'OpenAI' | 'Apple' | 'Meta' | 'Other'
  badge_status text not null default 'Pending', -- 'Going' | 'Pending'
  attendees_count integer not null default 0,
  created_at timestamptz default now()
);

-- Create event_reminders table for user registrations
create table if not exists public.event_reminders (
  user_id uuid references public.profiles(id) on delete cascade,
  event_id uuid references public.upcoming_events(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, event_id)
);

-- Enable RLS
alter table public.upcoming_events enable row level security;
alter table public.event_reminders enable row level security;

-- Policies for upcoming_events
create policy "Allow public read access to upcoming_events"
  on public.upcoming_events for select using (true);

create policy "Allow all write access for service role to upcoming_events"
  on public.upcoming_events for all using (true);

-- Policies for event_reminders
create policy "Allow users to view their own event reminders"
  on public.event_reminders for select
  using (auth.uid() = user_id);

create policy "Allow users to manage their own event reminders"
  on public.event_reminders for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Seed realistic upcoming events
insert into public.upcoming_events (title, description, event_date, location, organizer, category, badge_status, attendees_count)
values
  (
    'Google I/O 2026 — The Gemini 4.0 Era',
    'Join Google developers worldwide to discover the latest products, APIs, and open-source updates in consumer AI and workspace models.',
    '2026-05-19 10:00:00+00',
    'Shoreline Amphitheatre, Mountain View, CA',
    'By Google Developer Relations',
    'Google',
    'Going',
    14532
  ),
  (
    'OpenAI DevDay & Spring Update',
    'Exclusive preview of OpenAI GPT-5.5-preview and advanced voice agents rolling out in the developer API dashboard.',
    '2026-05-22 17:00:00+00',
    'San Francisco, CA (Virtual Broadcast)',
    'By OpenAI Developer Relations',
    'OpenAI',
    'Pending',
    8243
  ),
  (
    'Apple WWDC 2026 — Siri Re-imagined',
    'Unveiling iOS 20 and macOS 17 with Apple Intelligence 2.0 fully integrated with on-device LLMs and secure cloud compute.',
    '2026-06-08 10:00:00+00',
    'Apple Park, Cupertino, CA',
    'By Apple Software Engineering',
    'Apple',
    'Pending',
    24502
  ),
  (
    'Meta Llama 4 Open Source Launch',
    'Technical deep-dive into Meta''s largest open-weights 405B MoE foundation models and agentic tool-use features.',
    '2026-06-15 13:00:00+00',
    'Meta HQ, Menlo Park, CA',
    'By Meta AI Research (FAIR)',
    'Meta',
    'Going',
    5120
  )
on conflict do nothing;
