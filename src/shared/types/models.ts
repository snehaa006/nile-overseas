import type { Tables, Views } from "./database";

// Domain aliases: in this business a `product` row IS a brand (DRJ / Cloud9),
// and a `blanket` is the sellable item. We name the app-facing types accordingly.
export type Brand = Tables<"products">;
export type Blanket = Tables<"blankets">;
export type BlanketImage = Tables<"blanket_images">;
export type DailyStock = Tables<"daily_stock">;
export type SiteSettings = Tables<"site_settings">;
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
