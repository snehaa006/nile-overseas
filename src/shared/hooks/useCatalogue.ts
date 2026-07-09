import { useQuery } from "@tanstack/react-query";
import { qk } from "@/shared/lib/queryClient";
import { fetchCatalogue } from "@/shared/api/blankets";
import { fetchBrands } from "@/shared/api/brands";

export function useCatalogue() {
  return useQuery({ queryKey: qk.catalogue, queryFn: fetchCatalogue });
}

export function useBrands() {
  return useQuery({ queryKey: qk.brands, queryFn: fetchBrands });
}
