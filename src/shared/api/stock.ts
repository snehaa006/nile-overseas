import { supabase } from "@/shared/lib/supabase";
import type { StockRow } from "@/shared/types/models";
import type { Views } from "@/shared/types/database";

/**
 * All ACTIVE blankets for a month, left-joined to their stock row.
 * Blankets without a row yet appear with an undefined `stock` so the UI can
 * render an editable blank line for them.
 */
export type MonthStockLine = {
  blanket_id: string;
  name: string;
  sku: string | null;
  product_id: string;
  brand_name: string;
  stock: StockRow | null;
};

export async function fetchMonthStock(month: string): Promise<MonthStockLine[]> {
  const { data: blankets, error: bErr } = await supabase
    .from("blankets")
    .select("id, name, sku, product_id, display_order, products(name)")
    .eq("is_active", true)
    .order("product_id")
    .order("display_order");
  if (bErr) throw bErr;

  const { data: rows, error: sErr } = await supabase
    .from("monthly_stock")
    .select("*")
    .eq("month", month);
  if (sErr) throw sErr;

  const byBlanket = new Map((rows ?? []).map((r) => [r.blanket_id, r]));

  return (blankets ?? []).map((b) => {
    const row = byBlanket.get(b.id);
    return {
      blanket_id: b.id,
      name: b.name,
      sku: b.sku,
      product_id: b.product_id,
      brand_name: (b.products as { name: string } | null)?.name ?? "—",
      stock: row
        ? ({ ...row, blanket: { id: b.id, name: b.name, sku: b.sku, product_id: b.product_id } } as StockRow)
        : null,
    };
  });
}

export type UpsertStockInput = {
  blanket_id: string;
  month: string;
  opening_stock: number;
  production: number;
  sales: number;
  notes?: string | null;
};

/** Insert or update a month's line for a blanket (closing_stock is generated). */
export async function upsertStock(input: UpsertStockInput): Promise<void> {
  const { error } = await supabase
    .from("monthly_stock")
    .upsert(input, { onConflict: "blanket_id,month" });
  if (error) throw error;
}

export async function setMonthLock(
  month: string,
  locked: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("monthly_stock")
    .update({ is_locked: locked })
    .eq("month", month);
  if (error) throw error;
}

/** Distinct months that already have stock data, newest first. */
export async function fetchStockMonths(): Promise<string[]> {
  const { data, error } = await supabase
    .from("monthly_stock")
    .select("month")
    .order("month", { ascending: false });
  if (error) throw error;
  return [...new Set((data ?? []).map((r) => r.month))];
}

export async function fetchProductMonthlySummary(): Promise<
  Views<"product_monthly_summary">[]
> {
  const { data, error } = await supabase
    .from("product_monthly_summary")
    .select("*")
    .order("month", { ascending: false });
  if (error) throw error;
  return data;
}
