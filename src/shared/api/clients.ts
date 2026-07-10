import { supabase } from "@/shared/lib/supabase";
import type { Client } from "@/shared/types/models";
import type { TablesInsert, TablesUpdate } from "@/shared/types/database";

const CLIENT_PHOTOS_BUCKET = "client-photos";

/** All clients, ordered for the public timeline (manual order, then newest). */
export async function fetchClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("display_order")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function createClient(
  input: TablesInsert<"clients">,
): Promise<Client> {
  const { data, error } = await supabase
    .from("clients")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateClient(
  id: string,
  input: TablesUpdate<"clients">,
): Promise<Client> {
  const { data, error } = await supabase
    .from("clients")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteClient(client: Client): Promise<void> {
  const path = client.image_url ? storagePathFromUrl(client.image_url) : null;
  const { error } = await supabase.from("clients").delete().eq("id", client.id);
  if (error) throw error;
  if (path) await supabase.storage.from(CLIENT_PHOTOS_BUCKET).remove([path]);
}

/** Upload (or replace) a client's photo and return its public URL. */
export async function uploadClientPhoto(
  file: File,
  previousUrl?: string | null,
): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(CLIENT_PHOTOS_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (uploadError) throw uploadError;

  const publicUrl = supabase.storage
    .from(CLIENT_PHOTOS_BUCKET)
    .getPublicUrl(path).data.publicUrl;

  const previousPath = previousUrl ? storagePathFromUrl(previousUrl) : null;
  if (previousPath) {
    await supabase.storage.from(CLIENT_PHOTOS_BUCKET).remove([previousPath]);
  }
  return publicUrl;
}

function storagePathFromUrl(url: string): string | null {
  const marker = `/${CLIENT_PHOTOS_BUCKET}/`;
  const idx = url.indexOf(marker);
  return idx === -1 ? null : url.slice(idx + marker.length);
}
