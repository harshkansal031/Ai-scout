-- Backfill week_days array for existing users based on completed topics in progress_history for the current ISO week
with weekly_completions as (
  select
    user_id,
    -- Extract 1-based ISO day of the week (1=Monday, ..., 7=Sunday)
    extract(isodow from completed_at)::integer as day_idx
  from public.progress_history
  where
    -- Filter for topics completed in the current ISO week (starting Monday)
    completed_at >= date_trunc('week', now())
    and completed_at < date_trunc('week', now()) + interval '7 days'
),
aggregated_days as (
  select
    user_id,
    array[
      coalesce(bool_or(day_idx = 1), false),
      coalesce(bool_or(day_idx = 2), false),
      coalesce(bool_or(day_idx = 3), false),
      coalesce(bool_or(day_idx = 4), false),
      coalesce(bool_or(day_idx = 5), false),
      coalesce(bool_or(day_idx = 6), false),
      coalesce(bool_or(day_idx = 7), false)
    ] as computed_week_days
  from weekly_completions
  group by user_id
)
update public.user_progress up
set
  week_days = ad.computed_week_days,
  updated_at = now()
from aggregated_days ad
where up.user_id = ad.user_id;
