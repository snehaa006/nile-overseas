import { supabase, LOGO_BUCKET } from "@/shared/lib/supabase";
import type { SiteSettings } from "@/shared/types/models";
import type { TablesUpdate } from "@/shared/types/database";

export async function fetchSettings(): Promise<SiteSettings> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .single();
  if (error) throw error;
  return data;
}

export async function updateSettings(
  input: TablesUpdate<"site_settings">,
): Promise<SiteSettings> {
  const { data, error } = await supabase
    .from("site_settings")
    .update(input)
    .eq("id", 1)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Upload (or replace) the site-wide logo shown in the navbar/footer. */
export async function uploadSiteLogo(currentUrl: string | null | undefined, file: File): Promise<SiteSettings> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
  const path = `site/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(LOGO_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (uploadError) throw uploadError;

  const publicUrl = supabase.storage.from(LOGO_BUCKET).getPublicUrl(path).data.publicUrl;
  const previousPath = currentUrl ? storagePathFromUrl(currentUrl) : null;

  const { data, error } = await supabase
    .from("site_settings")
    .update({ logo_url: publicUrl })
    .eq("id", 1)
    .select()
    .single();
  if (error) {
    await supabase.storage.from(LOGO_BUCKET).remove([path]);
    throw error;
  }

  if (previousPath) await supabase.storage.from(LOGO_BUCKET).remove([previousPath]);
  return data;
}

export async function removeSiteLogo(currentUrl: string | null | undefined): Promise<SiteSettings> {
  const path = currentUrl ? storagePathFromUrl(currentUrl) : null;

  const { data, error } = await supabase
    .from("site_settings")
    .update({ logo_url: null })
    .eq("id", 1)
    .select()
    .single();
  if (error) throw error;

  if (path) await supabase.storage.from(LOGO_BUCKET).remove([path]);
  return data;
}

/** Upload (or replace) the Home hero image shown on the public homepage. */
export async function uploadHeroImage(currentUrl: string | null | undefined, file: File): Promise<SiteSettings> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `site/hero-${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(LOGO_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (uploadError) throw uploadError;

  const publicUrl = supabase.storage.from(LOGO_BUCKET).getPublicUrl(path).data.publicUrl;
  const previousPath = currentUrl ? storagePathFromUrl(currentUrl) : null;

  const { data, error } = await supabase
    .from("site_settings")
    .update({ hero_image_url: publicUrl })
    .eq("id", 1)
    .select()
    .single();
  if (error) {
    await supabase.storage.from(LOGO_BUCKET).remove([path]);
    throw error;
  }

  if (previousPath) await supabase.storage.from(LOGO_BUCKET).remove([previousPath]);
  return data;
}

export async function removeHeroImage(currentUrl: string | null | undefined): Promise<SiteSettings> {
  const path = currentUrl ? storagePathFromUrl(currentUrl) : null;

  const { data, error } = await supabase
    .from("site_settings")
    .update({ hero_image_url: null })
    .eq("id", 1)
    .select()
    .single();
  if (error) throw error;

  if (path) await supabase.storage.from(LOGO_BUCKET).remove([path]);
  return data;
}

/** Upload (or replace) the wide "work" photo shown in the About page quote section. */
export async function uploadAboutPhoto1(currentUrl: string | null | undefined, file: File): Promise<SiteSettings> {
  return uploadAboutPhoto("about_photo_1_url", currentUrl, file);
}

export async function removeAboutPhoto1(currentUrl: string | null | undefined): Promise<SiteSettings> {
  return removeAboutPhoto("about_photo_1_url", currentUrl);
}

/** Upload (or replace) the narrow portrait photo shown in the About page quote section. */
export async function uploadAboutPhoto2(currentUrl: string | null | undefined, file: File): Promise<SiteSettings> {
  return uploadAboutPhoto("about_photo_2_url", currentUrl, file);
}

export async function removeAboutPhoto2(currentUrl: string | null | undefined): Promise<SiteSettings> {
  return removeAboutPhoto("about_photo_2_url", currentUrl);
}

async function uploadAboutPhoto(
  column: "about_photo_1_url" | "about_photo_2_url",
  currentUrl: string | null | undefined,
  file: File,
): Promise<SiteSettings> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `site/${column}-${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(LOGO_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (uploadError) throw uploadError;

  const publicUrl = supabase.storage.from(LOGO_BUCKET).getPublicUrl(path).data.publicUrl;
  const previousPath = currentUrl ? storagePathFromUrl(currentUrl) : null;

  const update: TablesUpdate<"site_settings"> =
    column === "about_photo_1_url" ? { about_photo_1_url: publicUrl } : { about_photo_2_url: publicUrl };
  const { data, error } = await supabase
    .from("site_settings")
    .update(update)
    .eq("id", 1)
    .select()
    .single();
  if (error) {
    await supabase.storage.from(LOGO_BUCKET).remove([path]);
    throw error;
  }

  if (previousPath) await supabase.storage.from(LOGO_BUCKET).remove([previousPath]);
  return data;
}

async function removeAboutPhoto(
  column: "about_photo_1_url" | "about_photo_2_url",
  currentUrl: string | null | undefined,
): Promise<SiteSettings> {
  const path = currentUrl ? storagePathFromUrl(currentUrl) : null;

  const update: TablesUpdate<"site_settings"> =
    column === "about_photo_1_url" ? { about_photo_1_url: null } : { about_photo_2_url: null };
  const { data, error } = await supabase
    .from("site_settings")
    .update(update)
    .eq("id", 1)
    .select()
    .single();
  if (error) throw error;

  if (path) await supabase.storage.from(LOGO_BUCKET).remove([path]);
  return data;
}

function storagePathFromUrl(url: string): string | null {
  const marker = `/${LOGO_BUCKET}/`;
  const idx = url.indexOf(marker);
  return idx === -1 ? null : url.slice(idx + marker.length);
}
