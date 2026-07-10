import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/shared/lib/queryClient";
import {
  createClient,
  deleteClient,
  fetchClients,
  updateClient,
} from "@/shared/api/clients";
import type { Client } from "@/shared/types/models";
import type { TablesInsert, TablesUpdate } from "@/shared/types/database";

export function useClients() {
  return useQuery({
    queryKey: qk.clients,
    queryFn: fetchClients,
  });
}

function useInvalidateClients() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: qk.clients });
}

export function useCreateClient() {
  const invalidate = useInvalidateClients();
  return useMutation({
    mutationFn: (input: TablesInsert<"clients">) => createClient(input),
    onSuccess: invalidate,
  });
}

export function useUpdateClient() {
  const invalidate = useInvalidateClients();
  return useMutation({
    mutationFn: (args: { id: string; input: TablesUpdate<"clients"> }) =>
      updateClient(args.id, args.input),
    onSuccess: invalidate,
  });
}

export function useDeleteClient() {
  const invalidate = useInvalidateClients();
  return useMutation({
    mutationFn: (client: Client) => deleteClient(client),
    onSuccess: invalidate,
  });
}
