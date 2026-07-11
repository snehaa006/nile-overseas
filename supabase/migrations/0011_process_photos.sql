-- Applied to project nstwdxgrefzzqozuvejy.
-- One photo per stage of the public "Our 5-Step Manufacturing Process" page,
-- managed from the staff panel under Website Settings → Process photos.
-- The steps are fixed (they mirror the manufacturing pipeline), so the table
-- is keyed by the step slug rather than a generated id.
create table if not exists public.process_photos (
  step text primary key
    check (step in ('raschel', 'polish', 'printing', 'brushing', 'products')),
  image_url text,
  updated_at timestamptz not null default now()
);

alter table public.process_photos enable row level security;

drop policy if exists "public read process_photos" on public.process_photos;
create policy "public read process_photos" on public.process_photos
  for select using (true);

drop policy if exists "admin full access process_photos" on public.process_photos;
create policy "admin full access process_photos" on public.process_photos
  for all to authenticated
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop trigger if exists trg_process_photos_updated_at on public.process_photos;
create trigger trg_process_photos_updated_at
  before update on public.process_photos
  for each row execute function public.set_updated_at();

-- Public storage bucket for the step photos (5MB, images only), mirroring
-- the team-photos bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('process-photos', 'process-photos', true, 5242880,
        array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public read process photos" on storage.objects;
create policy "public read process photos" on storage.objects
  for select using (bucket_id = 'process-photos');

drop policy if exists "admin write process photos" on storage.objects;
create policy "admin write process photos" on storage.objects
  for insert to authenticated with check (bucket_id = 'process-photos');

drop policy if exists "admin update process photos" on storage.objects;
create policy "admin update process photos" on storage.objects
  for update to authenticated using (bucket_id = 'process-photos');

drop policy if exists "admin delete process photos" on storage.objects;
create policy "admin delete process photos" on storage.objects
  for delete to authenticated using (bucket_id = 'process-photos');
