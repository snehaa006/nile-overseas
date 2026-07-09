import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/** Central registry of query keys — avoids typo-driven cache misses. */
export const qk = {
  brands: ["brands"] as const,
  catalogue: ["catalogue"] as const,
  blankets: (brandId?: string) => ["blankets", brandId ?? "all"] as const,
  blanket: (idOrSku: string) => ["blanket", idOrSku] as const,
  images: (blanketId: string) => ["images", blanketId] as const,
  stock: (month: string) => ["stock", month] as const,
  stockMonths: ["stock-months"] as const,
  settings: ["settings"] as const,
  dashboard: ["dashboard"] as const,
  reportSummary: ["report-summary"] as const,
};
