import type { Tables, Views } from "./database";

// Domain aliases: in this business a `product` row IS a brand (DRJ / Cloud9),
// and a `blanket` is the sellable item. We name the app-facing types accordingly.
export type Brand = Tables<"products">;
export type Blanket = Tables<"blankets">;
export type BlanketImage = Tables<"blanket_images">;
export type DailyStock = Tables<"daily_stock">;
export type ProcessEntry = Tables<"process_entries">;
export type Agent = Tables<"agents">;
export type Customer = Tables<"customers">;
export type Client = Tables<"clients">;
export type TeamMember = Tables<"team_members">;
export type Review = Tables<"reviews">;
export type ContactMessage = Tables<"contact_messages">;
export type Employee = Tables<"employees">;
export type AttendanceRecord = Tables<"attendance">;
export type PayrollMonth = Tables<"payroll_months">;
/** A worker is either present or absent on a given day — nothing in between. */
export type AttendanceStatus = AttendanceRecord["status"];

/** What one worker earned in a month, derived from attendance. */
export type PayrollRow = {
  employee: Employee;
  presentDays: number;
  absentDays: number;
  overtimeHours: number;
  dayRate: number;
  hourlyRate: number;
  basePay: number;
  overtimePay: number;
  totalPay: number;
};

/** Default working days when a month hasn't been configured yet. */
export const DEFAULT_WORKING_DAYS = 26;

/**
 * Monthly salary is for a full month of work, so the day rate divides it by
 * the working days actually in that month, and the hourly rate divides that
 * by the shift length. Overtime is paid at the same hourly rate.
 */
export function calcPayroll(args: {
  employee: Employee;
  workingDays: number;
  presentDays: number;
  absentDays: number;
  overtimeHours: number;
}): PayrollRow {
  const { employee, workingDays, presentDays, absentDays, overtimeHours } = args;
  const dayRate = workingDays > 0 ? Number(employee.salary) / workingDays : 0;
  const hourlyRate = employee.shift_hours > 0 ? dayRate / Number(employee.shift_hours) : 0;
  const basePay = dayRate * presentDays;
  const overtimePay = hourlyRate * overtimeHours;

  return {
    employee,
    presentDays,
    absentDays,
    overtimeHours,
    dayRate,
    hourlyRate,
    basePay,
    overtimePay,
    totalPay: basePay + overtimePay,
  };
}
export type ProductionEntry = Tables<"production_entries">;
export type SiteSettings = Tables<"site_settings">;

/** The four fixed manufacturing processes tracked in the Process tab. */
export const PROCESSES = ["raschal", "polish", "printing", "brushing"] as const;
export type Process = (typeof PROCESSES)[number];
export const PROCESS_LABELS: Record<Process, string> = {
  raschal: "Raschal",
  polish: "Polish",
  printing: "Printing",
  brushing: "Brushing",
};
export type BlanketMonthlyStock = Views<"blanket_monthly_stock">;
export type BlanketYearlyStock = Views<"blanket_yearly_stock">;

/** A blanket with its images joined in. */
export type BlanketWithImages = Blanket & {
  images: BlanketImage[];
};

/** A blanket enriched with its brand + images (public detail / cards). */
export type BlanketWithRelations = Blanket & {
  brand: Pick<Brand, "id" | "name" | "slug">;
  images: BlanketImage[];
};

/** A brand together with its (active) blankets — used to group the catalogue. */
export type BrandWithBlankets = Brand & {
  blankets: BlanketWithImages[];
};

/** A daily_stock row joined with the blanket + brand it belongs to. */
export type StockRow = DailyStock & {
  blanket: Pick<Blanket, "id" | "name" | "sku" | "product_id">;
};

export type DashboardStats = {
  totalBrands: number;
  totalBlankets: number;
  activeBlankets: number;
  monthlyProduction: number;
  monthlySales: number;
  currentStock: number;
};
