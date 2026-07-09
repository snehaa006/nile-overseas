import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/shared/lib/queryClient";
import { fetchCatalogue } from "@/shared/api/blankets";
import { fetchBrands, uploadBrandLogo, removeBrandLogo } from "@/shared/api/brands";
import type { Brand } from "@/shared/types/models";

export function useCatalogue() {
  return useQuery({ queryKey: qk.catalogue, queryFn: fetchCatalogue });
}

export function useBrands() {
  return useQuery({ queryKey: qk.brands, queryFn: fetchBrands });
}

function useInvalidateBrands() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: qk.brands });
    qc.invalidateQueries({ queryKey: qk.catalogue });
  };
}

export function useUploadBrandLogo() {
  const invalidate = useInvalidateBrands();
  return useMutation({
    mutationFn: (args: { brand: Brand; file: File }) =>
      uploadBrandLogo(args.brand, args.file),
    onSuccess: invalidate,
  });
}

export function useRemoveBrandLogo() {
  const invalidate = useInvalidateBrands();
  return useMutation({
    mutationFn: (brand: Brand) => removeBrandLogo(brand),
    onSuccess: invalidate,
  });
}
