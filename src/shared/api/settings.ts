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

function storagePathFromUrl(url: string): string | null {
  const marker = `/${LOGO_BUCKET}/`;
  const idx = url.indexOf(marker);
  return idx === -1 ? null : url.slice(idx + marker.length);
}
