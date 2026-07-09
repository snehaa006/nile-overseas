-- Applied to project nstwdxgrefzzqozuvejy.
-- Adds brand logo support: a logo_url column on products, plus a public
-- storage bucket admins can upload/replace logos into from Website Settings.

alter table public.products add column if not exists logo_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('brand-logos', 'brand-logos', true, 2097152,
        array['image/jpeg','image/png','image/webp','image/svg+xml'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public read brand logos" on storage.objects;
create policy "public read brand logos" on storage.objects
  for select using (bucket_id = 'brand-logos');

drop policy if exists "admin write brand logos" on storage.objects;
create policy "admin write brand logos" on storage.objects
  for insert to authenticated with check (bucket_id = 'brand-logos');

drop policy if exists "admin update brand logos" on storage.objects;
create policy "admin update brand logos" on storage.objects
  for update to authenticated using (bucket_id = 'brand-logos');

drop policy if exists "admin delete brand logos" on storage.objects;
create policy "admin delete brand logos" on storage.objects
  for delete to authenticated using (bucket_id = 'brand-logos');
