import { supabase } from "@/shared/lib/supabase";
import type {
  Blanket,
  BlanketWithRelations,
  BrandWithBlankets,
} from "@/shared/types/models";
import type { TablesInsert, TablesUpdate } from "@/shared/types/database";

const BLANKET_WITH_IMAGES = "*, images:blanket_images(*)";

/** Public catalogue: brands each with their ACTIVE blankets + images. */
export async function fetchCatalogue(): Promise<BrandWithBlankets[]> {
  const { data, error } = await supabase
    .from("products")
    .select(`*, blankets(${BLANKET_WITH_IMAGES})`)
    .eq("blankets.is_active", true)
    .order("name")
    .order("display_order", { referencedTable: "blankets" });
  if (error) throw error;
  return (data ?? []) as unknown as BrandWithBlankets[];
}

/** All blankets for admin (optionally scoped to a brand), newest ordering. */
export async function fetchBlankets(brandId?: string): Promise<Blanket[]> {
  let query = supabase
    .from("blankets")
    .select("*")
    .order("display_order")
    .order("created_at", { ascending: false });
  if (brandId) query = query.eq("product_id", brandId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/** A single blanket by id OR sku, with brand + images (public detail page). */
export async function fetchBlanket(
  idOrSku: string,
): Promise<BlanketWithRelations | null> {
  const column = isUuid(idOrSku) ? "id" : "sku";
  const { data, error } = await supabase
    .from("blankets")
    .select(`*, brand:products(id, name, slug), images:blanket_images(*)`)
    .eq(column, idOrSku)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const blanket = data as unknown as BlanketWithRelations;
  blanket.images = [...blanket.images].sort(
    (a, b) =>
      Number(b.is_primary) - Number(a.is_primary) ||
      a.display_order - b.display_order,
  );
  return blanket;
}

export async function createBlanket(
  input: TablesInsert<"blankets">,
): Promise<Blanket> {
  const { data, error } = await supabase
    .from("blankets")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateBlanket(
  id: string,
  input: TablesUpdate<"blankets">,
): Promise<Blanket> {
  const { data, error } = await supabase
    .from("blankets")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Soft-deactivate (spec: "Deactivate Blanket", never hard-delete). */
export async function setBlanketActive(
  id: string,
  isActive: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("blankets")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) throw error;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}
