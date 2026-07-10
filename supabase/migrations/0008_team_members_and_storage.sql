-- Applied to project nstwdxgrefzzqozuvejy.
-- Team members: the people shown in the "Our Team" section at the bottom of the
-- public Home page. Each member has a photo, name, role and short description,
-- all managed from the staff panel under Website Settings → Our Team.
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  description text,
  image_url text,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.team_members enable row level security;

drop policy if exists "public read team_members" on public.team_members;
create policy "public read team_members" on public.team_members
  for select using (true);

drop policy if exists "admin full access team_members" on public.team_members;
create policy "admin full access team_members" on public.team_members
  for all to authenticated
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Public storage bucket for team photos (2MB, images only), mirroring client-photos.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('team-photos', 'team-photos', true, 2097152,
        array['image/jpeg','image/png','image/webp','image/svg+xml'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public read team photos" on storage.objects;
create policy "public read team photos" on storage.objects
  for select using (bucket_id = 'team-photos');

drop policy if exists "admin write team photos" on storage.objects;
create policy "admin write team photos" on storage.objects
  for insert to authenticated with check (bucket_id = 'team-photos');

drop policy if exists "admin update team photos" on storage.objects;
create policy "admin update team photos" on storage.objects
  for update to authenticated using (bucket_id = 'team-photos');

drop policy if exists "admin delete team photos" on storage.objects;
create policy "admin delete team photos" on storage.objects
  for delete to authenticated using (bucket_id = 'team-photos');

-- Seed placeholder members so the section is visible immediately; replace or
-- remove them from Website Settings → Our Team. Only runs while the table is empty.
insert into public.team_members (name, role, description, display_order)
select v.name, v.role, v.description, v.display_order
from (values
  ('Bonnie Green', 'Founder & Managing Director',
   'Leads Nile Overseas with a decade of experience and an eye for quality in every blanket we craft.', 0),
  ('Thomas Lean', 'Head of Production',
   'Oversees the manufacturing floor, keeping our mink and plush ranges consistent, soft and warm.', 1),
  ('Jese Leos', 'Design & Quality Lead',
   'Curates fabrics and finishes, making sure every piece meets our comfort and durability standards.', 2),
  ('Leslie Livingston', 'Sales & Client Relations',
   'Works closely with retailers and bulk buyers to deliver the right blankets, on time, every season.', 3)
) as v(name, role, description, display_order)
where not exists (select 1 from public.team_members);
