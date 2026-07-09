const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const NUM = new Intl.NumberFormat("en-IN");

export const formatCurrency = (value: number | null | undefined): string =>
  INR.format(Number(value ?? 0));

export const formatNumber = (value: number | null | undefined): string =>
  NUM.format(Number(value ?? 0));

export const formatWeight = (kg: number | null | undefined): string =>
  `${NUM.format(Number(kg ?? 0))} kg`;

/** "2026-07-01" -> "July 2026" */
export const formatMonth = (isoDate: string): string =>
  new Date(`${isoDate.slice(0, 7)}-01T00:00:00`).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

/** First day of a month as an ISO date string, e.g. "2026-07-01". */
export const monthKey = (date = new Date()): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
