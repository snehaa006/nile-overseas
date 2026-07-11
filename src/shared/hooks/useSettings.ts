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
  uploadAboutPhoto1,
  removeAboutPhoto1,
  uploadAboutPhoto2,
  removeAboutPhoto2,
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

export function useUploadAboutPhoto1() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { currentUrl: string | null | undefined; file: File }) =>
      uploadAboutPhoto1(args.currentUrl, args.file),
    onSuccess: (data) => qc.setQueryData(qk.settings, data),
  });
}

export function useRemoveAboutPhoto1() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (currentUrl: string | null | undefined) => removeAboutPhoto1(currentUrl),
    onSuccess: (data) => qc.setQueryData(qk.settings, data),
  });
}

export function useUploadAboutPhoto2() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { currentUrl: string | null | undefined; file: File }) =>
      uploadAboutPhoto2(args.currentUrl, args.file),
    onSuccess: (data) => qc.setQueryData(qk.settings, data),
  });
}

export function useRemoveAboutPhoto2() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (currentUrl: string | null | undefined) => removeAboutPhoto2(currentUrl),
    onSuccess: (data) => qc.setQueryData(qk.settings, data),
  });
}
