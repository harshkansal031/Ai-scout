-- ============================================================
-- AI Scout — Auto-schedule ingest-feed every 2 hours
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable the pg_cron and pg_net extensions (needed for HTTP calls from Postgres)
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Schedule ingest-feed to run every 1 hour automatically
select cron.schedule(
  'ingest-feed-every-hour',            -- job name (unique)
  '0 * * * *',                          -- every hour at minute 0
  $$
  select net.http_post(
    url    := (select decrypted_secret from vault.decrypted_secrets where name = 'supabase_url') || '/functions/v1/ingest-feed',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'supabase_service_role_key')
    ),
    body   := '{}'::jsonb
  );
  $$
);

-- Schedule generate-daily-topic to run every day at midnight (00:00)
select cron.schedule(
  'generate-daily-topic-midnight',
  '0 0 * * *',
  $$
  select net.http_post(
    url    := (select decrypted_secret from vault.decrypted_secrets where name = 'supabase_url') || '/functions/v1/generate-daily-topic',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'supabase_service_role_key')
    ),
    body   := '{}'::jsonb
  );
  $$
);
