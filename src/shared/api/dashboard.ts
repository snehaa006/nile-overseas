import { fetchAll, supabase } from "@/shared/lib/supabase";
import type { DashboardStats } from "@/shared/types/models";
import { monthKey } from "@/shared/utils/format";

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const month = monthKey();

  // The two summed reads are one row per blanket, so they are paged rather
  // than trusted to arrive whole — a tile that quietly sums half the roster
  // looks like a business result, not a bug.
  const [brands, blankets, active, monthly, latest] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("blankets").select("id", { count: "exact", head: true }),
    supabase
      .from("blankets")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
    fetchAll((from, to) =>
      supabase
        .from("blanket_monthly_stock")
        .select("blanket_id, production, sales")
        .eq("month", month)
        .order("blanket_id")
        .range(from, to),
    ),
    fetchAll((from, to) =>
      supabase
        .from("blanket_latest_stock")
        .select("blanket_id, closing_stock")
        .order("blanket_id")
        .range(from, to),
    ),
  ]);

  const sum = (rows: Record<string, unknown>[], key: string) =>
    rows.reduce((acc, r) => acc + Number(r[key] ?? 0), 0);

  return {
    totalBrands: brands.count ?? 0,
    totalBlankets: blankets.count ?? 0,
    activeBlankets: active.count ?? 0,
    monthlyProduction: sum(monthly, "production"),
    monthlySales: sum(monthly, "sales"),
    currentStock: sum(latest, "closing_stock"),
  };
}
