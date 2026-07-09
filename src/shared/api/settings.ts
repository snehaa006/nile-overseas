import { supabase } from "@/shared/lib/supabase";
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
