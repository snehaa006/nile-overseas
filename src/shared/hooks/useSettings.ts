import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { qk } from "@/shared/lib/queryClient";
import { fetchSettings, updateSettings } from "@/shared/api/settings";
import type { TablesUpdate } from "@/shared/types/database";

export function useSettings() {
  return useQuery({ queryKey: qk.settings, queryFn: fetchSettings });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TablesUpdate<"site_settings">) => updateSettings(input),
    onSuccess: (data) => qc.setQueryData(qk.settings, data),
  });
}
