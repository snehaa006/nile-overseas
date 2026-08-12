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
  processPhotos: ["process-photos"] as const,
  processMonthly: ["process-monthly"] as const,
  processYearly: ["process-yearly"] as const,
  agents: ["agents"] as const,
  customers: ["customers"] as const,
  clients: ["clients"] as const,
  teamMembers: ["team-members"] as const,
  reviews: ["reviews"] as const,
  reviewsAll: ["reviews", "all"] as const,
  contactMessages: ["contact-messages"] as const,
  employees: ["employees"] as const,
  employee: (id: string) => ["employee", id] as const,
  attendanceDay: (date: string) => ["attendance-day", date] as const,
  attendanceMonth: (month: string, employeeId?: string) =>
    ["attendance-month", month, employeeId ?? "all"] as const,
  payrollMonth: (month: string) => ["payroll-month", month] as const,
  advances: (month: string) => ["advances", month] as const,
  salaryPayments: (month: string) => ["salary-payments", month] as const,
  productionEntries: ["production-entries"] as const,
  agentSummary: (period: "month" | "year") => ["agent-summary", period] as const,
  customerSummary: (period: "month" | "year") => ["customer-summary", period] as const,
};
