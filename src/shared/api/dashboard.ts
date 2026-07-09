import { supabase } from "@/shared/lib/supabase";
import type { DashboardStats } from "@/shared/types/models";
import { monthKey } from "@/shared/utils/format";

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const month = monthKey();

  const [brands, blankets, active, stock] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("blankets").select("id", { count: "exact", head: true }),
    supabase
      .from("blankets")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("monthly_stock")
      .select("production, sales, closing_stock")
      .eq("month", month),
  ]);

  const rows = stock.data ?? [];
  const sum = (key: "production" | "sales" | "closing_stock") =>
    rows.reduce((acc, r) => acc + Number(r[key] ?? 0), 0);

  return {
    totalBrands: brands.count ?? 0,
    totalBlankets: blankets.count ?? 0,
    activeBlankets: active.count ?? 0,
    monthlyProduction: sum("production"),
    monthlySales: sum("sales"),
    currentStock: sum("closing_stock"),
  };
}
