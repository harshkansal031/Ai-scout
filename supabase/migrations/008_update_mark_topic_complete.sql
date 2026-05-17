-- Update mark_topic_complete to light up the corresponding day's dot in week_days array
create or replace function public.mark_topic_complete(p_user_id uuid, p_topic_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_ids text[];
  topic_title text;
  day_idx integer;
begin
  select completed_topic_ids into existing_ids
  from public.user_progress
  where user_id = p_user_id;

  if existing_ids is null then
    existing_ids := '{}';
  end if;

  if not (p_topic_id = any(existing_ids)) then
    select title into topic_title from public.daily_topics where id = p_topic_id;

    -- Calculate Monday-based day index (0 = Monday, ..., 6 = Sunday)
    -- EXTRACT(isodow FROM now()) returns 1 (Monday) to 7 (Sunday)
    day_idx := extract(isodow from now())::integer - 1;

    update public.user_progress
    set
      completed_topic_ids = array_append(completed_topic_ids, p_topic_id),
      topics_completed = topics_completed + 1,
      weekly_percent = least(100, weekly_percent + 8),
      streak = streak + 1,
      week_days[day_idx + 1] = true, -- Postgres array indices are 1-based
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
