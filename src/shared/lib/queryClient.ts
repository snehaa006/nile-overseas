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
  dayStock: (date: string) => ["day-stock", date] as const,
  stockDates: ["stock-dates"] as const,
  monthlyRollup: ["monthly-rollup"] as const,
  yearlyRollup: ["yearly-rollup"] as const,
  latestStock: ["latest-stock"] as const,
  settings: ["settings"] as const,
  dashboard: ["dashboard"] as const,
  reportSummary: ["report-summary"] as const,
  processDay: (date: string) => ["process-day", date] as const,
  processMonthly: ["process-monthly"] as const,
  processYearly: ["process-yearly"] as const,
  agents: ["agents"] as const,
  customers: ["customers"] as const,
  clients: ["clients"] as const,
  productionEntries: ["production-entries"] as const,
  agentMonthly: ["agent-monthly"] as const,
  customerMonthly: ["customer-monthly"] as const,
};
