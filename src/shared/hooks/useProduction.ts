import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/shared/lib/queryClient";
import {
  addAgent,
  addCustomer,
  addProductionEntry,
  deleteAgent,
  deleteCustomer,
  deleteProductionEntry,
  fetchAgents,
  fetchCustomers,
  fetchProductionEntries,
  type AddProductionEntryInput,
} from "@/shared/api/production";

export function useAgents() {
  return useQuery({ queryKey: qk.agents, queryFn: fetchAgents });
}

export function useCustomers() {
  return useQuery({ queryKey: qk.customers, queryFn: fetchCustomers });
}

export function useProductionEntries() {
  return useQuery({ queryKey: qk.productionEntries, queryFn: fetchProductionEntries });
}

export function useAddAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => addAgent(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.agents }),
  });
}

export function useAddCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => addCustomer(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.customers }),
  });
}

export function useDeleteAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAgent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.agents }),
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCustomer(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.customers }),
  });
}

export function useAddProductionEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AddProductionEntryInput) => addProductionEntry(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.productionEntries }),
  });
}

export function useDeleteProductionEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProductionEntry(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.productionEntries }),
  });
}
