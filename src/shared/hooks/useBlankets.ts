import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { qk } from "@/shared/lib/queryClient";
import {
  createBlanket,
  fetchBlanket,
  fetchBlankets,
  setBlanketActive,
  updateBlanket,
} from "@/shared/api/blankets";
import type { TablesInsert, TablesUpdate } from "@/shared/types/database";

export function useBlankets(brandId?: string) {
  return useQuery({
    queryKey: qk.blankets(brandId),
    queryFn: () => fetchBlankets(brandId),
  });
}

export function useBlanket(idOrSku: string | undefined) {
  return useQuery({
    queryKey: qk.blanket(idOrSku ?? ""),
    queryFn: () => fetchBlanket(idOrSku!),
    enabled: Boolean(idOrSku),
  });
}

function useInvalidateBlankets() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["blankets"] });
    qc.invalidateQueries({ queryKey: qk.catalogue });
    qc.invalidateQueries({ queryKey: qk.dashboard });
  };
}

export function useCreateBlanket() {
  const invalidate = useInvalidateBlankets();
  return useMutation({
    mutationFn: (input: TablesInsert<"blankets">) => createBlanket(input),
    onSuccess: invalidate,
  });
}

export function useUpdateBlanket() {
  const invalidate = useInvalidateBlankets();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; input: TablesUpdate<"blankets"> }) =>
      updateBlanket(args.id, args.input),
    onSuccess: (data) => {
      invalidate();
      qc.invalidateQueries({ queryKey: qk.blanket(data.id) });
    },
  });
}

export function useToggleBlanketActive() {
  const invalidate = useInvalidateBlankets();
  return useMutation({
    mutationFn: (args: { id: string; isActive: boolean }) =>
      setBlanketActive(args.id, args.isActive),
    onSuccess: invalidate,
  });
}
