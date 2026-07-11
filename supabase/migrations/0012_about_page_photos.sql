-- Adds two editable photo slots for the About page's "quote and pictures"
-- section (a wide work/office-style photo and a narrower portrait photo).
--
-- Reuses the existing `brand-logos` storage bucket (same `site/` prefix and
-- policies used by the hero image), so no new bucket or policy is needed.

alter table public.site_settings
  add column if not exists about_photo_1_url text,
  add column if not exists about_photo_2_url text;
