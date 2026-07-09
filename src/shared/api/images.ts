import { supabase, STORAGE_BUCKET } from "@/shared/lib/supabase";
import type { BlanketImage } from "@/shared/types/models";

export async function fetchImages(blanketId: string): Promise<BlanketImage[]> {
  const { data, error } = await supabase
    .from("blanket_images")
    .select("*")
    .eq("blanket_id", blanketId)
    .order("is_primary", { ascending: false })
    .order("display_order");
  if (error) throw error;
  return data;
}

/**
 * Upload a file to storage and register a blanket_images row.
 * If it's the blanket's first image, it becomes primary automatically.
 */
export async function uploadImage(
  blanketId: string,
  file: File,
): Promise<BlanketImage> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${blanketId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (uploadError) throw uploadError;

  const publicUrl = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path).data.publicUrl;

  const existing = await fetchImages(blanketId);
  const isPrimary = existing.length === 0;

  const { data, error } = await supabase
    .from("blanket_images")
    .insert({
      blanket_id: blanketId,
      image_url: publicUrl,
      is_primary: isPrimary,
      display_order: existing.length,
    })
    .select()
    .single();
  if (error) {
    // roll back the orphaned storage object on DB failure
    await supabase.storage.from(STORAGE_BUCKET).remove([path]);
    throw error;
  }
  return data;
}

export async function deleteImage(image: BlanketImage): Promise<void> {
  const path = storagePathFromUrl(image.image_url);
  const { error } = await supabase
    .from("blanket_images")
    .delete()
    .eq("id", image.id);
  if (error) throw error;
  if (path) await supabase.storage.from(STORAGE_BUCKET).remove([path]);

  // If we removed the primary, promote the next image.
  if (image.is_primary) {
    const remaining = await fetchImages(image.blanket_id);
    if (remaining.length > 0) await setPrimaryImage(remaining[0].id, image.blanket_id);
  }
}

/** Make one image primary and clear the flag on the blanket's other images. */
export async function setPrimaryImage(
  imageId: string,
  blanketId: string,
): Promise<void> {
  const { error: clearError } = await supabase
    .from("blanket_images")
    .update({ is_primary: false })
    .eq("blanket_id", blanketId);
  if (clearError) throw clearError;

  const { error } = await supabase
    .from("blanket_images")
    .update({ is_primary: true })
    .eq("id", imageId);
  if (error) throw error;
}

function storagePathFromUrl(url: string): string | null {
  const marker = `/${STORAGE_BUCKET}/`;
  const idx = url.indexOf(marker);
  return idx === -1 ? null : url.slice(idx + marker.length);
}
