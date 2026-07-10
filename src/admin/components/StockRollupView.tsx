import { useMemo } from "react";
import { Download } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { LoadingState, ErrorState, EmptyState } from "@/shared/components/StateViews";
import { formatNumber, formatWeight } from "@/shared/utils/format";
import { downloadCsv, toCsv } from "@/shared/utils/csv";

export type RollupRow = {
  blanket_id: string;
  blanket_name: string;
  sku: string | null;
  weight_kg: number;
  brand_name: string;
  period: string;
  opening_stock: number;
  production: number;
  sales: number;
  closing_stock: number;
};

/**
 * Flat opening/production/sales/closing table per blanket per period,
 * grouped by brand — reused for both the monthly and yearly rollup tabs.
 */
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
  const byBrand = useMemo(() => {
    const map = new Map<string, RollupRow[]>();
    for (const r of rows ?? []) {
      const arr = map.get(r.brand_name) ?? [];
      arr.push(r);
      map.set(r.brand_name, arr);
    }
    for (const arr of map.values()) {
      arr.sort(
        (a, b) => b.period.localeCompare(a.period) || a.blanket_name.localeCompare(b.blanket_name),
      );
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [rows]);

  const handleExport = () => {
    if (!rows || rows.length === 0) return;
    const headers = ["Period", "Brand", "Blanket", "SKU", "Weight (kg)", "Opening", "Production", "Sales", "Closing"];
    const csvRows = byBrand.flatMap(([brand, brandRows]) =>
      brandRows.map((r) => [
        formatPeriod(r.period), brand, r.blanket_name, r.sku, r.weight_kg,
        r.opening_stock, r.production, r.sales, r.closing_stock,
      ]),
    );
    downloadCsv(`${csvFilenamePrefix}.csv`, toCsv(headers, csvRows));
  };

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState error={error} onRetry={refetch} />;
  if (!rows || rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {byBrand.map(([brand, brandRows]) => (
        <Card key={brand}>
          <CardContent className="p-0">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="font-serif text-lg font-semibold text-primary">{brand}</h2>
              <span className="text-sm text-muted-foreground">{brandRows.length} entries</span>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold text-foreground">Period</TableHead>
                  <TableHead className="font-bold text-foreground">Blanket</TableHead>
                  <TableHead className="text-right font-bold text-foreground">Opening</TableHead>
                  <TableHead className="text-right font-bold text-foreground">Production</TableHead>
                  <TableHead className="text-right font-bold text-foreground">Sales</TableHead>
                  <TableHead className="text-right font-bold text-foreground">Closing</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {brandRows.map((r) => (
                  <TableRow key={`${r.blanket_id}-${r.period}`}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatPeriod(r.period)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {r.blanket_name}
                      <span className="ml-2 font-mono text-xs text-muted-foreground">{r.sku}</span>
                      <span className="ml-2 whitespace-nowrap text-xs text-muted-foreground">
                        &middot; {formatWeight(r.weight_kg)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumber(r.opening_stock)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumber(r.production)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumber(r.sales)}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatNumber(r.closing_stock)}
                    </TableCell>
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
