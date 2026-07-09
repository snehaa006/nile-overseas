import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { useAllMonthlyStock } from "@/shared/hooks/useStock";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { LoadingState, ErrorState, EmptyState } from "@/shared/components/StateViews";
import { formatMonth, formatNumber } from "@/shared/utils/format";
import { downloadCsv, toCsv } from "@/shared/utils/csv";
import { cn } from "@/shared/utils/cn";

type Metric = "closing_stock" | "production" | "sales";

const METRICS: { value: Metric; label: string }[] = [
  { value: "closing_stock", label: "Closing stock" },
  { value: "production", label: "Production" },
  { value: "sales", label: "Sales" },
];

export function AllMonthsView() {
  const { data: rows, isLoading, isError, error, refetch } = useAllMonthlyStock();
  const [metric, setMetric] = useState<Metric>("closing_stock");

  const { months, byBrand } = useMemo(() => {
    const monthSet = new Set<string>();
    const brandMap = new Map<
      string,
      Map<string, { name: string; sku: string | null; byMonth: Map<string, number> }>
    >();

    for (const r of rows ?? []) {
      monthSet.add(r.month);
      const brand = brandMap.get(r.brand_name) ?? new Map();
      const blanket = brand.get(r.blanket_id) ?? { name: r.blanket_name, sku: r.sku, byMonth: new Map() };
      blanket.byMonth.set(r.month, r[metric]);
      brand.set(r.blanket_id, blanket);
      brandMap.set(r.brand_name, brand);
    }

    return {
      months: [...monthSet].sort(),
      byBrand: [...brandMap.entries()].sort(([a], [b]) => a.localeCompare(b)),
    };
  }, [rows, metric]);

  const handleExport = () => {
    const headers = ["Brand", "Blanket", "SKU", ...months.map((m) => formatMonth(m))];
    const csvRows = byBrand.flatMap(([brand, blankets]) =>
      [...blankets.values()].map((b) => [
        brand,
        b.name,
        b.sku,
        ...months.map((m) => b.byMonth.get(m) ?? ""),
      ]),
    );
    downloadCsv(
      `nile-overseas-${METRICS.find((m) => m.value === metric)?.label.toLowerCase().replace(" ", "-")}.csv`,
      toCsv(headers, csvRows),
    );
  };

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState error={error} onRetry={refetch} />;
  if (months.length === 0) {
    return (
      <EmptyState
        title="No stock history yet"
        description="Once you save data for a few months, they'll appear side by side here."
      />
    );
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
                  {months.map((m) => (
                    <TableHead key={m} className="whitespace-nowrap text-right">
                      {formatMonth(m)}
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
                    {months.map((m) => (
                      <TableCell key={m} className="text-right tabular-nums">
                        {b.byMonth.has(m) ? formatNumber(b.byMonth.get(m)) : "—"}
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
