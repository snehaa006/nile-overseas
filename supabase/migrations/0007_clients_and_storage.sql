-- Applied to project nstwdxgrefzzqozuvejy.
-- Clients: logos/photos of companies Nile Overseas works with, shown on the
-- public "Our Clients" timeline and managed from the staff (admin) panel.
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  image_url text,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.clients enable row level security;

drop policy if exists "public read clients" on public.clients;
create policy "public read clients" on public.clients
  for select using (true);

drop policy if exists "admin full access clients" on public.clients;
create policy "admin full access clients" on public.clients
  for all to authenticated
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Public storage bucket for client photos (2MB, images only), mirroring brand-logos.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('client-photos', 'client-photos', true, 2097152,
        array['image/jpeg','image/png','image/webp','image/svg+xml'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public read client photos" on storage.objects;
create policy "public read client photos" on storage.objects
  for select using (bucket_id = 'client-photos');

drop policy if exists "admin write client photos" on storage.objects;
create policy "admin write client photos" on storage.objects
  for insert to authenticated with check (bucket_id = 'client-photos');

drop policy if exists "admin update client photos" on storage.objects;
create policy "admin update client photos" on storage.objects
  for update to authenticated using (bucket_id = 'client-photos');

drop policy if exists "admin delete client photos" on storage.objects;
create policy "admin delete client photos" on storage.objects
  for delete to authenticated using (bucket_id = 'client-photos');
