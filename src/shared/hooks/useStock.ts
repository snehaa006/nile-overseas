import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { qk } from "@/shared/lib/queryClient";
import {
  fetchDayStock,
  fetchLatestStock,
  fetchMonthlyRollup,
  fetchProductMonthlySummary,
  fetchStockDates,
  fetchYearlyRollup,
  setDayLock,
  upsertStock,
  type UpsertStockInput,
} from "@/shared/api/stock";

export function useDayStock(date: string) {
  return useQuery({
    queryKey: qk.dayStock(date),
    queryFn: () => fetchDayStock(date),
  });
}

export function useStockDates() {
  return useQuery({ queryKey: qk.stockDates, queryFn: fetchStockDates });
}

export function useMonthlyRollup() {
  return useQuery({ queryKey: qk.monthlyRollup, queryFn: fetchMonthlyRollup });
}

export function useYearlyRollup() {
  return useQuery({ queryKey: qk.yearlyRollup, queryFn: fetchYearlyRollup });
}

export function useLatestStock() {
  return useQuery({ queryKey: qk.latestStock, queryFn: fetchLatestStock });
}

export function useProductMonthlySummary() {
  return useQuery({
    queryKey: qk.reportSummary,
    queryFn: fetchProductMonthlySummary,
  });
}

export function useUpsertStock(date: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpsertStockInput) => upsertStock(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.dayStock(date) });
      qc.invalidateQueries({ queryKey: qk.stockDates });
      qc.invalidateQueries({ queryKey: qk.monthlyRollup });
      qc.invalidateQueries({ queryKey: qk.yearlyRollup });
      qc.invalidateQueries({ queryKey: qk.latestStock });
      qc.invalidateQueries({ queryKey: qk.reportSummary });
      qc.invalidateQueries({ queryKey: qk.dashboard });
    },
  });
}

export function useToggleDayLock(date: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (locked: boolean) => setDayLock(date, locked),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.dayStock(date) });
      qc.invalidateQueries({ queryKey: qk.monthlyRollup });
      qc.invalidateQueries({ queryKey: qk.yearlyRollup });
    },
  });
}
