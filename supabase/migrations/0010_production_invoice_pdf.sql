-- Applied to project nstwdxgrefzzqozuvejy.
-- Production entries can carry an attached invoice PDF, uploaded from the
-- staff panel's "Add entry" dialog.
alter table public.production_entries
  add column if not exists invoice_path text;

-- Private bucket: invoices are internal financial documents, so the staff
-- panel reads them through short-lived signed URLs instead of public URLs
-- (unlike the public image buckets used elsewhere).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('invoices', 'invoices', false, 10485760, array['application/pdf'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "admin read invoices" on storage.objects;
create policy "admin read invoices" on storage.objects
  for select to authenticated using (bucket_id = 'invoices');

drop policy if exists "admin write invoices" on storage.objects;
create policy "admin write invoices" on storage.objects
  for insert to authenticated with check (bucket_id = 'invoices');

drop policy if exists "admin update invoices" on storage.objects;
create policy "admin update invoices" on storage.objects
  for update to authenticated using (bucket_id = 'invoices');

drop policy if exists "admin delete invoices" on storage.objects;
create policy "admin delete invoices" on storage.objects
  for delete to authenticated using (bucket_id = 'invoices');
