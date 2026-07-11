-- Applied to project nstwdxgrefzzqozuvejy.
-- Enquiries submitted through the public Contact page form, read by staff
-- in the admin panel under Messages.
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  email text check (email is null or char_length(email) <= 160),
  phone text check (phone is null or char_length(phone) <= 40),
  message text not null check (char_length(message) between 1 and 2000),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

-- Anyone can send a message; it must arrive unread.
drop policy if exists "public insert contact_messages" on public.contact_messages;
create policy "public insert contact_messages" on public.contact_messages
  for insert to anon, authenticated
  with check (not is_read);

-- Only staff can read, update or delete messages.
drop policy if exists "admin full access contact_messages" on public.contact_messages;
create policy "admin full access contact_messages" on public.contact_messages
  for all to authenticated
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
