import { supabase } from "@/shared/lib/supabase";
import type { Brand } from "@/shared/types/models";

export async function fetchBrands(): Promise<Brand[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("name");
  if (error) throw error;
  return data;
}
