import { useQuery } from "@tanstack/react-query";
import { qk } from "@/shared/lib/queryClient";
import { fetchDashboardStats } from "@/shared/api/dashboard";

export function useDashboard() {
  return useQuery({ queryKey: qk.dashboard, queryFn: fetchDashboardStats });
}
