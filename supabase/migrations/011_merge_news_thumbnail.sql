-- Persist a thumbnail URL once the client successfully loads an Open Graph image.
-- SECURITY DEFINER: no direct UPDATE on content_items from clients; validates URL shape only.

create or replace function public.merge_news_thumbnail(p_content_id text, p_image_url text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  trimmed text := trim(coalesce(p_image_url, ''));
begin
  if p_content_id is null or length(trimmed) < 15 then
    return;
  end if;
  if length(trimmed) > 4096 then
    return;
  end if;
  if trimmed ~* '^https?://([^/]+\.)?logo\.clearbit\.com/' then
    return;
  end if;
  if trimmed !~* '^https?://' then
    return;
  end if;

  update public.content_items
  set
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'imageUrl', trimmed,
      'imageUrlConfirmedAt', to_jsonb(now())
    ),
    updated_at = now()
  where id = p_content_id
    and type in ('news', 'research', 'paper');
end;
$$;

revoke all on function public.merge_news_thumbnail(text, text) from public;
grant execute on function public.merge_news_thumbnail(text, text) to anon, authenticated;
