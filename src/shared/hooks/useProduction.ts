import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/shared/lib/queryClient";
import {
  addAgent,
  addCustomer,
  addProductionEntry,
  deleteAgent,
  deleteCustomer,
  deleteProductionEntry,
  fetchAgentSummary,
  fetchAgents,
  fetchCustomerSummary,
  fetchCustomers,
  fetchProductionEntries,
  type AddProductionEntryInput,
  type PeriodKind,
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

export function useAgentSummary(period: PeriodKind) {
  return useQuery({
    queryKey: qk.agentSummary(period),
    queryFn: () => fetchAgentSummary(period),
  });
}

export function useCustomerSummary(period: PeriodKind) {
  return useQuery({
    queryKey: qk.customerSummary(period),
    queryFn: () => fetchCustomerSummary(period),
  });
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

function useInvalidateProductionEntries() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: qk.productionEntries });
    // Prefix match invalidates both the month and year variants.
    qc.invalidateQueries({ queryKey: ["agent-summary"] });
    qc.invalidateQueries({ queryKey: ["customer-summary"] });
  };
}

export function useAddProductionEntry() {
  const invalidate = useInvalidateProductionEntries();
  return useMutation({
    mutationFn: (input: AddProductionEntryInput) => addProductionEntry(input),
    onSuccess: invalidate,
  });
}

export function useDeleteProductionEntry() {
  const invalidate = useInvalidateProductionEntries();
  return useMutation({
    mutationFn: (entry: { id: string; invoice_path: string | null }) =>
      deleteProductionEntry(entry),
    onSuccess: invalidate,
  });
}
