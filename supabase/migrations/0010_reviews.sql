-- Applied to project nstwdxgrefzzqozuvejy.
-- Customer reviews: collected through the "Customer Reviews" card on the
-- Contact page and shown on the public Home page. Anyone can leave a review;
-- staff can hide or delete entries from Website Settings → Customer Reviews.
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  rating integer not null check (rating between 1 and 5),
  message text not null check (char_length(message) between 1 and 600),
  is_approved boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.reviews enable row level security;

-- Visitors only ever see approved reviews.
drop policy if exists "public read approved reviews" on public.reviews;
create policy "public read approved reviews" on public.reviews
  for select using (is_approved);

-- Anyone may submit a review; it goes live immediately (is_approved defaults
-- to true) but must not arrive pre-hidden.
drop policy if exists "public insert reviews" on public.reviews;
create policy "public insert reviews" on public.reviews
  for insert to anon, authenticated
  with check (is_approved);

-- Staff (authenticated) can also see hidden reviews, hide and delete them.
drop policy if exists "admin full access reviews" on public.reviews;
create policy "admin full access reviews" on public.reviews
  for all to authenticated
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
