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
