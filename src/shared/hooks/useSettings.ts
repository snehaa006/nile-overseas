import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { qk } from "@/shared/lib/queryClient";
import {
  fetchSettings,
  updateSettings,
  uploadSiteLogo,
  removeSiteLogo,
  uploadHeroImage,
  removeHeroImage,
} from "@/shared/api/settings";
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

export function useUploadSiteLogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { currentUrl: string | null | undefined; file: File }) =>
      uploadSiteLogo(args.currentUrl, args.file),
    onSuccess: (data) => qc.setQueryData(qk.settings, data),
  });
}

export function useRemoveSiteLogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (currentUrl: string | null | undefined) => removeSiteLogo(currentUrl),
    onSuccess: (data) => qc.setQueryData(qk.settings, data),
  });
}

export function useUploadHeroImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { currentUrl: string | null | undefined; file: File }) =>
      uploadHeroImage(args.currentUrl, args.file),
    onSuccess: (data) => qc.setQueryData(qk.settings, data),
  });
}

export function useRemoveHeroImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (currentUrl: string | null | undefined) => removeHeroImage(currentUrl),
    onSuccess: (data) => qc.setQueryData(qk.settings, data),
  });
}
