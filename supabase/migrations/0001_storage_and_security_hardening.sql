-- Applied to project nstwdxgrefzzqozuvejy.
-- The base schema (products, blankets, blanket_images, monthly_stock,
-- site_settings, triggers, RLS) already existed. This migration adds the
-- storage bucket the image workflow needs and resolves security advisories.

-- 1. Public storage bucket for blanket images (5MB, images only)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('blanket-images', 'blanket-images', true, 5242880,
        array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 2. Storage RLS: anyone reads; only authenticated admins write/delete
drop policy if exists "public read blanket images" on storage.objects;
create policy "public read blanket images" on storage.objects
  for select using (bucket_id = 'blanket-images');

drop policy if exists "admin write blanket images" on storage.objects;
create policy "admin write blanket images" on storage.objects
  for insert to authenticated with check (bucket_id = 'blanket-images');

drop policy if exists "admin update blanket images" on storage.objects;
create policy "admin update blanket images" on storage.objects
  for update to authenticated using (bucket_id = 'blanket-images');

drop policy if exists "admin delete blanket images" on storage.objects;
create policy "admin delete blanket images" on storage.objects
  for delete to authenticated using (bucket_id = 'blanket-images');

-- 3. Reporting view runs with the querying user's RLS, not the creator's
alter view public.product_monthly_summary set (security_invoker = on);

-- 4. Pin search_path on trigger functions
alter function public.set_updated_at() set search_path = '';
alter function public.generate_blanket_sku() set search_path = public;
alter function public.prevent_locked_stock_edit() set search_path = '';
