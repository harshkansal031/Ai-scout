-- ============================================================
-- Scout AI — Topic Content cron job (2x daily refresh)
-- Run this in the Supabase SQL Editor after 005_explore_topics.sql
-- Requires: pg_cron + pg_net extensions (enabled in 003_cron_schedule.sql)
-- ============================================================

-- Schedule fetch-topic-content to run at 06:00 and 18:00 UTC every day
-- The function fetches fresh articles/papers for ALL explore_topics and
-- atomically swaps old content with new using the staging batch pattern.

select cron.schedule(
  'fetch-topic-content-morning',
  '0 6 * * *',
  $$
  select net.http_post(
    url     := (select decrypted_secret from vault.decrypted_secrets where name = 'supabase_url') || '/functions/v1/fetch-topic-content',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'supabase_service_role_key')
    ),
    body    := jsonb_build_object('run_all', true, 'batch_id', gen_random_uuid()::text)
  );
  $$
);

select cron.schedule(
  'fetch-topic-content-evening',
  '0 18 * * *',
  $$
  select net.http_post(
    url     := (select decrypted_secret from vault.decrypted_secrets where name = 'supabase_url') || '/functions/v1/fetch-topic-content',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'supabase_service_role_key')
    ),
    body    := jsonb_build_object('run_all', true, 'batch_id', gen_random_uuid()::text)
  );
  $$
);
