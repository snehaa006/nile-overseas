-- Adds an editable Home hero image to site_settings.
--
-- The public Home hero previously auto-picked the first product photo it could
-- find. It now shows this admin-uploaded image (managed from Website Settings),
-- and falls back to a styled placeholder when none is set.
--
-- Reuses the existing `brand-logos` storage bucket (same `site/` prefix and
-- policies used by the site logo), so no new bucket or policy is needed.

alter table public.site_settings
  add column if not exists hero_image_url text;
