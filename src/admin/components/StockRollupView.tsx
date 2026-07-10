import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { LoadingState, ErrorState, EmptyState } from "@/shared/components/StateViews";
import { formatNumber } from "@/shared/utils/format";
import { downloadCsv, toCsv } from "@/shared/utils/csv";
import { cn } from "@/shared/utils/cn";

type Metric = "closing_stock" | "production" | "sales";

const METRICS: { value: Metric; label: string }[] = [
  { value: "closing_stock", label: "Closing stock" },
  { value: "production", label: "Production" },
  { value: "sales", label: "Sales" },
];

export type RollupRow = {
  blanket_id: string;
  blanket_name: string;
  sku: string | null;
  brand_name: string;
  period: string;
  production: number;
  sales: number;
  closing_stock: number;
};

/** Pivoted blanket × period table, reused for both the monthly and yearly rollup tabs. */
export function StockRollupView({
  rows,
  isLoading,
  isError,
  error,
  refetch,
  formatPeriod,
  emptyTitle,
  emptyDescription,
  csvFilenamePrefix,
}: {
  rows: RollupRow[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
  formatPeriod: (period: string) => string;
  emptyTitle: string;
  emptyDescription: string;
  csvFilenamePrefix: string;
}) {
  const [metric, setMetric] = useState<Metric>("closing_stock");

  const { periods, byBrand } = useMemo(() => {
    const periodSet = new Set<string>();
    const brandMap = new Map<
      string,
      Map<string, { name: string; sku: string | null; byPeriod: Map<string, number> }>
    >();

    for (const r of rows ?? []) {
      periodSet.add(r.period);
      const brand = brandMap.get(r.brand_name) ?? new Map();
      const blanket = brand.get(r.blanket_id) ?? { name: r.blanket_name, sku: r.sku, byPeriod: new Map() };
      blanket.byPeriod.set(r.period, r[metric]);
      brand.set(r.blanket_id, blanket);
      brandMap.set(r.brand_name, brand);
    }

    return {
      periods: [...periodSet].sort(),
      byBrand: [...brandMap.entries()].sort(([a], [b]) => a.localeCompare(b)),
    };
  }, [rows, metric]);

  const handleExport = () => {
    const headers = ["Brand", "Blanket", "SKU", ...periods.map(formatPeriod)];
    const csvRows = byBrand.flatMap(([brand, blankets]) =>
      [...blankets.values()].map((b) => [
        brand,
        b.name,
        b.sku,
        ...periods.map((p) => b.byPeriod.get(p) ?? ""),
      ]),
    );
    downloadCsv(
      `${csvFilenamePrefix}-${METRICS.find((m) => m.value === metric)?.label.toLowerCase().replace(" ", "-")}.csv`,
      toCsv(headers, csvRows),
    );
  };

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState error={error} onRetry={refetch} />;
  if (periods.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {METRICS.map((m) => (
            <button
              key={m.value}
              onClick={() => setMetric(m.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition",
                metric === m.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-muted",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {byBrand.map(([brand, blankets]) => (
        <Card key={brand}>
          <CardContent className="p-0">
            <div className="border-b px-4 py-3">
              <h2 className="font-serif text-lg font-semibold text-primary">{brand}</h2>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-card">Blanket</TableHead>
                  {periods.map((p) => (
                    <TableHead key={p} className="whitespace-nowrap text-right">
                      {formatPeriod(p)}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...blankets.values()].map((b) => (
                  <TableRow key={b.sku ?? b.name}>
                    <TableCell className="sticky left-0 bg-card font-medium">
                      {b.name}
                      <span className="ml-2 font-mono text-xs text-muted-foreground">{b.sku}</span>
                    </TableCell>
                    {periods.map((p) => (
                      <TableCell key={p} className="text-right tabular-nums">
                        {b.byPeriod.has(p) ? formatNumber(b.byPeriod.get(p)) : "—"}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
