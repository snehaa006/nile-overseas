import { fetchAll, supabase, LOGO_BUCKET } from "@/shared/lib/supabase";
import type { Brand } from "@/shared/types/models";

export async function fetchBrands(): Promise<Brand[]> {
  return fetchAll((from, to) =>
    supabase.from("products").select("*").order("name").order("id").range(from, to),
  );
}

/** Upload (or replace) a brand's logo and store its public URL on the brand. */
export async function uploadBrandLogo(brand: Brand, file: File): Promise<Brand> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
  const path = `${brand.id}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(LOGO_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (uploadError) throw uploadError;

  const publicUrl = supabase.storage.from(LOGO_BUCKET).getPublicUrl(path).data.publicUrl;
  const previousPath = brand.logo_url ? storagePathFromUrl(brand.logo_url) : null;

  const { data, error } = await supabase
    .from("products")
    .update({ logo_url: publicUrl })
    .eq("id", brand.id)
    .select()
    .single();
  if (error) {
    await supabase.storage.from(LOGO_BUCKET).remove([path]);
    throw error;
  }

  if (previousPath) await supabase.storage.from(LOGO_BUCKET).remove([previousPath]);
  return data;
}

export async function removeBrandLogo(brand: Brand): Promise<Brand> {
  const path = brand.logo_url ? storagePathFromUrl(brand.logo_url) : null;

  const { data, error } = await supabase
    .from("products")
    .update({ logo_url: null })
    .eq("id", brand.id)
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
