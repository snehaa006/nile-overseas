import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { qk } from "@/shared/lib/queryClient";
import {
  fetchMonthStock,
  fetchProductMonthlySummary,
  fetchStockMonths,
  setMonthLock,
  upsertStock,
  type UpsertStockInput,
} from "@/shared/api/stock";

export function useMonthStock(month: string) {
  return useQuery({
    queryKey: qk.stock(month),
    queryFn: () => fetchMonthStock(month),
  });
}

export function useStockMonths() {
  return useQuery({ queryKey: qk.stockMonths, queryFn: fetchStockMonths });
}

export function useProductMonthlySummary() {
  return useQuery({
    queryKey: qk.reportSummary,
    queryFn: fetchProductMonthlySummary,
  });
}

export function useUpsertStock(month: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpsertStockInput) => upsertStock(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.stock(month) });
      qc.invalidateQueries({ queryKey: qk.stockMonths });
      qc.invalidateQueries({ queryKey: qk.reportSummary });
      qc.invalidateQueries({ queryKey: qk.dashboard });
    },
  });
}

export function useToggleMonthLock(month: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (locked: boolean) => setMonthLock(month, locked),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.stock(month) }),
  });
}
