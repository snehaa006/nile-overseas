-- Run this manually in the Supabase SQL editor for project nstwdxgrefzzqozuvejy
-- (Settings > SQL Editor > New query), since this environment has no live DB
-- connection to apply it automatically.
--
-- Adds: a site-wide logo + "established" year to site_settings (surfaced in
-- Website Settings), and renames the two brands to their full public names.

-- 1. Site logo + founding year, editable from Website Settings.
alter table public.site_settings
  add column if not exists logo_url text;

alter table public.site_settings
  add column if not exists established_year integer not null default 2014;

-- 2. Brand rename: DRJ -> "Paris Royale DRJ", Cloud9 -> "CloudNine".
-- Matched case-insensitively against the current name so this is safe to
-- re-run (rows already renamed simply won't match a second time).
update public.products
  set name = 'Paris Royale DRJ'
  where lower(name) = 'drj';

update public.products
  set name = 'CloudNine'
  where lower(name) in ('cloud9', 'cloud 9', 'cloudnine');
