import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/shared/lib/queryClient";
import {
  addProcessEntry,
  deleteProcessEntry,
  fetchProcessDay,
  fetchProcessMonthly,
  fetchProcessYearly,
  type AddProcessEntryInput,
} from "@/shared/api/process";

export function useProcessDay(date: string) {
  return useQuery({
    queryKey: qk.processDay(date),
    queryFn: () => fetchProcessDay(date),
  });
}

export function useProcessMonthly() {
  return useQuery({ queryKey: qk.processMonthly, queryFn: fetchProcessMonthly });
}

export function useProcessYearly() {
  return useQuery({ queryKey: qk.processYearly, queryFn: fetchProcessYearly });
}

function useInvalidateProcess(date: string) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: qk.processDay(date) });
    qc.invalidateQueries({ queryKey: qk.processMonthly });
    qc.invalidateQueries({ queryKey: qk.processYearly });
  };
}

export function useAddProcessEntry(date: string) {
  const invalidate = useInvalidateProcess(date);
  return useMutation({
    mutationFn: (input: AddProcessEntryInput) => addProcessEntry(input),
    onSuccess: invalidate,
  });
}

export function useDeleteProcessEntry(date: string) {
  const invalidate = useInvalidateProcess(date);
  return useMutation({
    mutationFn: (id: string) => deleteProcessEntry(id),
    onSuccess: invalidate,
  });
}
