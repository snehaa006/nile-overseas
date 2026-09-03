import { fetchAll, supabase } from "@/shared/lib/supabase";
import type { StockRow } from "@/shared/types/models";
import type { Views } from "@/shared/types/database";

export type DayStockLine = {
  blanket_id: string;
  name: string;
  sku: string | null;
  weight_kg: number;
  product_id: string;
  brand_name: string;
  stock: StockRow | null;
  /** Prior day's closing stock, when the row for this date doesn't exist yet. */
  priorClosing: number | null;
};

async function fetchActiveBlanketsWithBrand() {
  return fetchAll((from, to) =>
    supabase
      .from("blankets")
      .select("id, name, sku, weight_kg, product_id, display_order, products(name)")
      .eq("is_active", true)
      .order("product_id")
      .order("display_order")
      .order("id")
      .range(from, to),
  );
}

/**
 * All ACTIVE blankets for a date, left-joined to their stock row.
 * Blankets without a row yet carry `priorClosing` so the UI can show the
 * would-be opening figure before the row is created (see DB trigger
 * `set_opening_from_prior_day`, which enforces this server-side too).
 */
export async function fetchDayStock(date: string): Promise<DayStockLine[]> {
  const blankets = await fetchActiveBlanketsWithBrand();

  const rows = await fetchAll((from, to) =>
    supabase.from("daily_stock").select("*").eq("date", date).order("id").range(from, to),
  );
  const byBlanket = new Map(rows.map((r) => [r.blanket_id, r]));

  // Every day before this one, newest first — the first row seen for a blanket
  // is its last recorded closing. That is the whole history, so it grows by a
  // row per blanket per day and must be paged.
  const priorRows = await fetchAll((from, to) =>
    supabase
      .from("daily_stock")
      .select("blanket_id, date, closing_stock")
      .lt("date", date)
      .order("date", { ascending: false })
      .order("blanket_id")
      .range(from, to),
  );
  const priorClosingByBlanket = new Map<string, number>();
  for (const r of priorRows) {
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
      weight_kg: Number(b.weight_kg),
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
  date: string;
  opening_stock: number;
  production: number;
  sales: number;
  notes?: string | null;
};

/** Insert or update one or more blankets' lines for a day in a single request (closing_stock is generated). */
export async function upsertStock(input: UpsertStockInput | UpsertStockInput[]): Promise<void> {
  const { error } = await supabase
    .from("daily_stock")
    .upsert(input, { onConflict: "blanket_id,date" });
  if (error) throw error;
}

/** Locks/unlocks every blanket's entry for a specific date. */
export async function setDayLock(date: string, locked: boolean): Promise<void> {
  const { error } = await supabase
    .from("daily_stock")
    .update({ is_locked: locked })
    .eq("date", date);
  if (error) throw error;
}

/** Distinct dates that already have stock data, newest first. */
export async function fetchStockDates(): Promise<string[]> {
  const data = await fetchAll((from, to) =>
    supabase
      .from("daily_stock")
      .select("date, id")
      .order("date", { ascending: false })
      .order("id")
      .range(from, to),
  );
  return [...new Set(data.map((r) => r.date))];
}

export async function fetchProductMonthlySummary(): Promise<
  Views<"product_monthly_summary">[]
> {
  // The view groups on (product_id, month), so that pair orders it uniquely.
  return fetchAll((from, to) =>
    supabase
      .from("product_monthly_summary")
      .select("*")
      .order("month", { ascending: false })
      .order("product_id")
      .range(from, to),
  );
}

/**
 * Rollup views have no FK metadata for PostgREST to embed `blankets` in the
 * same query, so blanket/brand names are fetched separately and joined here.
 * (Every blanket, not just active ones — history for a deactivated blanket
 * should still show up in reports.)
 */
async function fetchBlanketBrandMap() {
  const data = await fetchAll((from, to) =>
    supabase
      .from("blankets")
      .select("id, name, sku, weight_kg, products(name)")
      .order("id")
      .range(from, to),
  );
  const map = new Map<string, { name: string; sku: string | null; weight_kg: number; brand_name: string }>();
  for (const b of data) {
    map.set(b.id, {
      name: b.name,
      sku: b.sku,
      weight_kg: Number(b.weight_kg),
      brand_name: (b.products as { name: string } | null)?.name ?? "—",
    });
  }
  return map;
}

export type BlanketMonthlyRow = {
  blanket_id: string;
  blanket_name: string;
  sku: string | null;
  weight_kg: number;
  brand_name: string;
  month: string;
  opening_stock: number;
  production: number;
  sales: number;
  closing_stock: number;
  days_recorded: number;
};

/** Monthly rollup (sum of production/sales, first/last day's opening/closing) across every blanket. */
export async function fetchMonthlyRollup(): Promise<BlanketMonthlyRow[]> {
  // The view groups on (blanket_id, month), so that pair orders it uniquely.
  const [data, blankets] = await Promise.all([
    fetchAll((from, to) =>
      supabase
        .from("blanket_monthly_stock")
        .select("blanket_id, month, opening_stock, production, sales, closing_stock, days_recorded")
        .order("month")
        .order("blanket_id")
        .range(from, to),
    ),
    fetchBlanketBrandMap(),
  ]);

  return data.map((r) => {
    const b = blankets.get(r.blanket_id!);
    return {
      blanket_id: r.blanket_id!,
      blanket_name: b?.name ?? "—",
      sku: b?.sku ?? null,
      weight_kg: b?.weight_kg ?? 0,
      brand_name: b?.brand_name ?? "—",
      month: r.month!,
      opening_stock: Number(r.opening_stock ?? 0),
      production: Number(r.production ?? 0),
      sales: Number(r.sales ?? 0),
      closing_stock: Number(r.closing_stock ?? 0),
      days_recorded: Number(r.days_recorded ?? 0),
    };
  });
}

export type BlanketYearlyRow = {
  blanket_id: string;
  blanket_name: string;
  sku: string | null;
  weight_kg: number;
  brand_name: string;
  year: string;
  opening_stock: number;
  production: number;
  sales: number;
  closing_stock: number;
  days_recorded: number;
};

/** Yearly rollup (sum of production/sales, first/last day's opening/closing) across every blanket. */
export async function fetchYearlyRollup(): Promise<BlanketYearlyRow[]> {
  const [data, blankets] = await Promise.all([
    fetchAll((from, to) =>
      supabase
        .from("blanket_yearly_stock")
        .select("blanket_id, year, opening_stock, production, sales, closing_stock, days_recorded")
        .order("year")
        .order("blanket_id")
        .range(from, to),
    ),
    fetchBlanketBrandMap(),
  ]);

  return data.map((r) => {
    const b = blankets.get(r.blanket_id!);
    return {
      blanket_id: r.blanket_id!,
      blanket_name: b?.name ?? "—",
      sku: b?.sku ?? null,
      weight_kg: b?.weight_kg ?? 0,
      brand_name: b?.brand_name ?? "—",
      year: r.year!,
      opening_stock: Number(r.opening_stock ?? 0),
      production: Number(r.production ?? 0),
      sales: Number(r.sales ?? 0),
      closing_stock: Number(r.closing_stock ?? 0),
      days_recorded: Number(r.days_recorded ?? 0),
    };
  });
}

/** Latest recorded closing stock per active blanket (for "current stock" widgets). */
export async function fetchLatestStock(): Promise<Map<string, number>> {
  // One row per blanket, so blanket_id alone is a total order.
  const data = await fetchAll((from, to) =>
    supabase
      .from("blanket_latest_stock")
      .select("blanket_id, closing_stock")
      .order("blanket_id")
      .range(from, to),
  );
  return new Map(data.map((r) => [r.blanket_id as string, Number(r.closing_stock ?? 0)]));
}
