import { supabase } from "@/shared/lib/supabase";
import type { TeamMember } from "@/shared/types/models";
import type { TablesInsert, TablesUpdate } from "@/shared/types/database";

const TEAM_PHOTOS_BUCKET = "team-photos";

/** All team members, ordered for the public "Our Team" section. */
export async function fetchTeamMembers(): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from("team_members")
    .select("*")
    .order("display_order")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function createTeamMember(
  input: TablesInsert<"team_members">,
): Promise<TeamMember> {
  const { data, error } = await supabase
    .from("team_members")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTeamMember(
  id: string,
  input: TablesUpdate<"team_members">,
): Promise<TeamMember> {
  const { data, error } = await supabase
    .from("team_members")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTeamMember(member: TeamMember): Promise<void> {
  const path = member.image_url ? storagePathFromUrl(member.image_url) : null;
  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("id", member.id);
  if (error) throw error;
  if (path) await supabase.storage.from(TEAM_PHOTOS_BUCKET).remove([path]);
}

/** Upload (or replace) a team member's photo and return its public URL. */
export async function uploadTeamPhoto(
  file: File,
  previousUrl?: string | null,
): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(TEAM_PHOTOS_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (uploadError) throw uploadError;

  const publicUrl = supabase.storage
    .from(TEAM_PHOTOS_BUCKET)
    .getPublicUrl(path).data.publicUrl;

  const previousPath = previousUrl ? storagePathFromUrl(previousUrl) : null;
  if (previousPath) {
    await supabase.storage.from(TEAM_PHOTOS_BUCKET).remove([previousPath]);
  }
  return publicUrl;
}

function storagePathFromUrl(url: string): string | null {
  const marker = `/${TEAM_PHOTOS_BUCKET}/`;
  const idx = url.indexOf(marker);
  return idx === -1 ? null : url.slice(idx + marker.length);
}
