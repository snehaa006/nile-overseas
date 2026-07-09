import { supabase } from "@/shared/lib/supabase";
import type { StockRow } from "@/shared/types/models";
import type { Views } from "@/shared/types/database";

export type MonthStockLine = {
  blanket_id: string;
  name: string;
  sku: string | null;
  product_id: string;
  brand_name: string;
  stock: StockRow | null;
  /** Prior month's closing stock, when the row for this month doesn't exist yet. */
  priorClosing: number | null;
};

async function fetchActiveBlanketsWithBrand() {
  const { data, error } = await supabase
    .from("blankets")
    .select("id, name, sku, product_id, display_order, products(name)")
    .eq("is_active", true)
    .order("product_id")
    .order("display_order");
  if (error) throw error;
  return data ?? [];
}

/**
 * All ACTIVE blankets for a month, left-joined to their stock row.
 * Blankets without a row yet carry `priorClosing` so the UI can show the
 * would-be opening figure before the row is created (see DB trigger
 * `set_opening_from_prior_month`, which enforces this server-side too).
 */
export async function fetchMonthStock(month: string): Promise<MonthStockLine[]> {
  const blankets = await fetchActiveBlanketsWithBrand();

  const { data: rows, error: sErr } = await supabase
    .from("monthly_stock")
    .select("*")
    .eq("month", month);
  if (sErr) throw sErr;
  const byBlanket = new Map((rows ?? []).map((r) => [r.blanket_id, r]));

  const { data: priorRows, error: pErr } = await supabase
    .from("monthly_stock")
    .select("blanket_id, month, closing_stock")
    .lt("month", month)
    .order("month", { ascending: false });
  if (pErr) throw pErr;
  const priorClosingByBlanket = new Map<string, number>();
  for (const r of priorRows ?? []) {
    if (!priorClosingByBlanket.has(r.blanket_id)) {
      priorClosingByBlanket.set(r.blanket_id, Number(r.closing_stock ?? 0));
    }
  }

  return blankets.map((b) => {
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
      priorClosing: priorClosingByBlanket.get(b.id) ?? null,
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

export type BlanketMonthlyRow = {
  blanket_id: string;
  blanket_name: string;
  sku: string | null;
  brand_name: string;
  month: string;
  opening_stock: number;
  production: number;
  sales: number;
  closing_stock: number;
  is_locked: boolean;
};

/** Full stock history across every active blanket, for consolidated/report views. */
export async function fetchAllMonthlyStock(): Promise<BlanketMonthlyRow[]> {
  const { data, error } = await supabase
    .from("monthly_stock")
    .select(
      "month, opening_stock, production, sales, closing_stock, is_locked, blanket:blankets(id, name, sku, product_id, products(name))",
    )
    .order("month");
  if (error) throw error;

  return (data ?? []).map((r) => {
    const b = r.blanket as unknown as {
      id: string; name: string; sku: string | null; product_id: string;
      products: { name: string } | null;
    };
    return {
      blanket_id: b.id,
      blanket_name: b.name,
      sku: b.sku,
      brand_name: b.products?.name ?? "—",
      month: r.month,
      opening_stock: Number(r.opening_stock ?? 0),
      production: Number(r.production ?? 0),
      sales: Number(r.sales ?? 0),
      closing_stock: Number(r.closing_stock ?? 0),
      is_locked: r.is_locked,
    };
  });
}
