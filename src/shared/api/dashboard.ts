import { supabase } from "@/shared/lib/supabase";
import type { DashboardStats } from "@/shared/types/models";
import { monthKey } from "@/shared/utils/format";

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const month = monthKey();

  const [brands, blankets, active, monthly, latest] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("blankets").select("id", { count: "exact", head: true }),
    supabase
      .from("blankets")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("blanket_monthly_stock")
      .select("production, sales")
      .eq("month", month),
    supabase.from("blanket_latest_stock").select("closing_stock"),
  ]);

  const sum = (rows: Record<string, number | null>[], key: string) =>
    rows.reduce((acc, r) => acc + Number(r[key] ?? 0), 0);

  return {
    totalBrands: brands.count ?? 0,
    totalBlankets: blankets.count ?? 0,
    activeBlankets: active.count ?? 0,
    monthlyProduction: sum(monthly.data ?? [], "production"),
    monthlySales: sum(monthly.data ?? [], "sales"),
    currentStock: sum(latest.data ?? [], "closing_stock"),
  };
}
