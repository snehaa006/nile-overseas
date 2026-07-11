import { supabase } from "@/shared/lib/supabase";

const PROCESS_PHOTOS_BUCKET = "process-photos";

/**
 * The five fixed stages of the public "How It's Made" page. The keys match
 * the `process_photos.step` check constraint, so both the admin manager and
 * the public page iterate this list rather than hardcoding steps twice.
 */
export const PROCESS_PHOTO_STEPS = [
  { key: "raschel", label: "Raschel" },
  { key: "polish", label: "Polish" },
  { key: "printing", label: "Printing" },
  { key: "brushing", label: "Brushing" },
  { key: "products", label: "Products" },
] as const;

export type ProcessPhotoStep = (typeof PROCESS_PHOTO_STEPS)[number]["key"];

/** step → public image URL, only for steps that have a photo set. */
export async function fetchProcessPhotos(): Promise<Record<string, string>> {
  const { data, error } = await supabase.from("process_photos").select("step, image_url");
  if (error) throw error;
  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    if (row.image_url) map[row.step] = row.image_url;
  }
  return map;
}

/** Upload (or replace) one step's photo and return its public URL. */
export async function uploadProcessPhoto(
  step: ProcessPhotoStep,
  file: File,
  previousUrl?: string | null,
): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${step}-${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(PROCESS_PHOTOS_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (uploadError) throw uploadError;

  const publicUrl = supabase.storage
    .from(PROCESS_PHOTOS_BUCKET)
    .getPublicUrl(path).data.publicUrl;

  const { error } = await supabase
    .from("process_photos")
    .upsert({ step, image_url: publicUrl });
  if (error) {
    // roll back the orphaned storage object on DB failure
    await supabase.storage.from(PROCESS_PHOTOS_BUCKET).remove([path]);
    throw error;
  }

  const previousPath = previousUrl ? storagePathFromUrl(previousUrl) : null;
  if (previousPath) {
    await supabase.storage.from(PROCESS_PHOTOS_BUCKET).remove([previousPath]);
  }
  return publicUrl;
}

export async function removeProcessPhoto(
  step: ProcessPhotoStep,
  currentUrl?: string | null,
): Promise<void> {
  const { error } = await supabase
    .from("process_photos")
    .upsert({ step, image_url: null });
  if (error) throw error;

  const path = currentUrl ? storagePathFromUrl(currentUrl) : null;
  if (path) await supabase.storage.from(PROCESS_PHOTOS_BUCKET).remove([path]);
}

function storagePathFromUrl(url: string): string | null {
  const marker = `/${PROCESS_PHOTOS_BUCKET}/`;
  const idx = url.indexOf(marker);
  return idx === -1 ? null : url.slice(idx + marker.length);
}
