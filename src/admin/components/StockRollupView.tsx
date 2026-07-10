import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
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
  const [search, setSearch] = useState("");

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

  const filteredByBrand = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return byBrand;
    return byBrand
      .map(([brand, brandRows]) => [
        brand,
        brandRows.filter(
          (r) => r.blanket_name.toLowerCase().includes(q) || (r.sku ?? "").toLowerCase().includes(q),
        ),
      ] as [string, RollupRow[]])
      .filter(([, brandRows]) => brandRows.length > 0);
  }, [byBrand, search]);

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search blanket…"
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {filteredByBrand.length === 0 ? (
        <EmptyState title="No matches" description={`No blankets match "${search}".`} />
      ) : (
        filteredByBrand.map(([brand, brandRows]) => (
        <Card key={brand}>
          <CardContent className="p-0">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="font-serif text-lg font-semibold text-primary">{brand}</h2>
              <span className="text-sm text-muted-foreground">{brandRows.length} entries</span>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/60 hover:bg-muted/60">
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
                    <TableCell className="whitespace-nowrap py-4 text-muted-foreground">
                      {formatPeriod(r.period)}
                    </TableCell>
                    <TableCell className="py-4 font-medium">
                      {r.blanket_name}
                      <span className="ml-2 font-mono text-xs text-muted-foreground">{r.sku}</span>
                      <span className="ml-2 whitespace-nowrap text-xs text-muted-foreground">
                        &middot; {formatWeight(r.weight_kg)}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 text-right tabular-nums text-muted-foreground">{formatNumber(r.opening_stock)}</TableCell>
                    <TableCell className="py-4 text-right tabular-nums">{formatNumber(r.production)}</TableCell>
                    <TableCell className="py-4 text-right tabular-nums text-amber-600">{formatNumber(r.sales)}</TableCell>
                    <TableCell className="py-4 text-right font-bold tabular-nums text-emerald-600">
                      {formatNumber(r.closing_stock)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        ))
      )}
    </div>
  );
}
