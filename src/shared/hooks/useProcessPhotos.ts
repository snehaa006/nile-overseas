import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/shared/lib/queryClient";
import {
  fetchProcessPhotos,
  removeProcessPhoto,
  uploadProcessPhoto,
  type ProcessPhotoStep,
} from "@/shared/api/processPhotos";

export function useProcessPhotos() {
  return useQuery({ queryKey: qk.processPhotos, queryFn: fetchProcessPhotos });
}

export function useUploadProcessPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { step: ProcessPhotoStep; file: File; previousUrl?: string | null }) =>
      uploadProcessPhoto(input.step, input.file, input.previousUrl),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.processPhotos }),
  });
}

export function useRemoveProcessPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { step: ProcessPhotoStep; currentUrl?: string | null }) =>
      removeProcessPhoto(input.step, input.currentUrl),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.processPhotos }),
  });
}
