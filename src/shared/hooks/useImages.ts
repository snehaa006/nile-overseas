import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { qk } from "@/shared/lib/queryClient";
import {
  deleteImage,
  fetchImages,
  setPrimaryImage,
  uploadImage,
} from "@/shared/api/images";
import type { BlanketImage } from "@/shared/types/models";

export function useImages(blanketId: string | undefined) {
  return useQuery({
    queryKey: qk.images(blanketId ?? ""),
    queryFn: () => fetchImages(blanketId!),
    enabled: Boolean(blanketId),
  });
}

function useImageInvalidate(blanketId: string) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: qk.images(blanketId) });
    qc.invalidateQueries({ queryKey: qk.catalogue });
    qc.invalidateQueries({ queryKey: qk.blanket(blanketId) });
  };
}

export function useUploadImage(blanketId: string) {
  const invalidate = useImageInvalidate(blanketId);
  return useMutation({
    mutationFn: (file: File) => uploadImage(blanketId, file),
    onSuccess: invalidate,
  });
}

export function useDeleteImage(blanketId: string) {
  const invalidate = useImageInvalidate(blanketId);
  return useMutation({
    mutationFn: (image: BlanketImage) => deleteImage(image),
    onSuccess: invalidate,
  });
}

export function useSetPrimaryImage(blanketId: string) {
  const invalidate = useImageInvalidate(blanketId);
  return useMutation({
    mutationFn: (imageId: string) => setPrimaryImage(imageId, blanketId),
    onSuccess: invalidate,
  });
}
