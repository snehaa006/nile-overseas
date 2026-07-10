import { useEffect, useMemo, useState } from "react";
import { Lock, Unlock, Download, Check } from "lucide-react";
import { toast } from "sonner";
import {
  useDayStock, useToggleDayLock, useMonthlyRollup, useYearlyRollup, useUpsertStock,
} from "@/shared/hooks/useStock";
import {
  StockRowEditor, initialRowValues, isOpeningEditable, isRowDirty, type RowValues,
} from "../components/StockRowEditor";
import { StockRollupView } from "../components/StockRollupView";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/components/ui/tabs";
import { DatePicker } from "@/shared/components/ui/date-picker";
import {
  Table, TableBody, TableHead, TableHeader, TableRow,
} from "@/shared/components/ui/table";
import { LoadingState, ErrorState, EmptyState, Spinner } from "@/shared/components/StateViews";
import { dateKey, formatDate, formatMonth, formatNumber, formatYear } from "@/shared/utils/format";
import { downloadCsv, toCsv } from "@/shared/utils/csv";
import type { DayStockLine } from "@/shared/api/stock";

export function StockPage() {
  const [date, setDate] = useState(dateKey());
  const { data: lines, isLoading, isError, error, refetch } = useDayStock(date);
  const toggleLock = useToggleDayLock(date);
  const upsertAll = useUpsertStock(date);

  const monthlyRollup = useMonthlyRollup();
  const yearlyRollup = useYearlyRollup();

  const [rowValues, setRowValues] = useState<Record<string, RowValues>>({});

  useEffect(() => {
    if (!lines) return;
    const next: Record<string, RowValues> = {};
    for (const line of lines) next[line.blanket_id] = initialRowValues(line);
    setRowValues(next);
  }, [lines]);

  const updateValue = (blanketId: string, field: "opening" | "production" | "sales", value: string) => {
    setRowValues((prev) => ({ ...prev, [blanketId]: { ...prev[blanketId], [field]: value } }));
  };

  const locked = useMemo(
    () => Boolean(lines?.some((l) => l.stock?.is_locked)),
    [lines],
  );

  const byBrand = useMemo(() => {
    const map = new Map<string, DayStockLine[]>();
    for (const line of lines ?? []) {
      const arr = map.get(line.brand_name) ?? [];
      arr.push(line);
      map.set(line.brand_name, arr);
    }
    return [...map.entries()];
  }, [lines]);

  const dirtyLines = useMemo(
    () => (lines ?? []).filter((l) => rowValues[l.blanket_id] && isRowDirty(l, rowValues[l.blanket_id])),
    [lines, rowValues],
  );

  const totals = useMemo(() => {
    return (lines ?? []).reduce(
      (acc, l) => {
        acc.production += Number(l.stock?.production ?? 0);
        acc.sales += Number(l.stock?.sales ?? 0);
        acc.closing += Number(l.stock?.closing_stock ?? (l.priorClosing ?? 0));
        return acc;
      },
      { production: 0, sales: 0, closing: 0 },
    );
  }, [lines]);

  const hasAnyData = Boolean(lines?.some((l) => l.stock));

  const handleLock = async () => {
    if (!hasAnyData) {
      toast.error("Add stock data before locking the day.");
      return;
    }
    try {
      await toggleLock.mutateAsync(!locked);
      toast.success(locked ? "Day unlocked" : "Day locked");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const handleSaveAll = async () => {
    if (dirtyLines.length === 0) return;
    try {
      await upsertAll.mutateAsync(
        dirtyLines.map((line) => {
          const values = rowValues[line.blanket_id];
          return {
            blanket_id: line.blanket_id,
            date,
            opening_stock: isOpeningEditable(line)
              ? Number(values.opening || 0)
              : Number(values.opening),
            production: Number(values.production || 0),
            sales: Number(values.sales || 0),
          };
        }),
      );
      toast.success(`Saved ${dirtyLines.length} ${dirtyLines.length === 1 ? "blanket" : "blankets"}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  };

  const handleExport = () => {
    if (!lines || lines.length === 0) return;
    const headers = ["Brand", "Blanket", "SKU", "Opening", "Production", "Sales", "Closing"];
    const rows = lines.map((l) => [
      l.brand_name,
      l.name,
      l.sku,
      l.stock ? l.stock.opening_stock : (l.priorClosing ?? 0),
      l.stock?.production ?? 0,
      l.stock?.sales ?? 0,
      l.stock?.closing_stock ?? (l.priorClosing ?? 0),
    ]);
    downloadCsv(`nile-overseas-stock-${date}.csv`, toCsv(headers, rows));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-primary">Stock</h1>
          <p className="text-muted-foreground">
            Opening + Production − Sales = Closing. Opening carries forward automatically, day to day.
          </p>
        </div>
      </div>

      <Tabs defaultValue="day">
        <TabsList>
          <TabsTrigger value="day">Daily Entry</TabsTrigger>
          <TabsTrigger value="month">Monthly Summary</TabsTrigger>
          <TabsTrigger value="year">Yearly Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="day" className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <DatePicker value={date} onChange={setDate} />
              {locked ? (
                <Badge variant="muted"><Lock className="mr-1 h-3 w-3" /> Locked</Badge>
              ) : (
                <Badge variant="success">Open</Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExport} disabled={!lines?.length}>
                <Download className="h-4 w-4" /> Export CSV
              </Button>
              <Button variant="outline" onClick={handleLock} disabled={toggleLock.isPending}>
                {locked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                {locked ? "Unlock" : "Lock day"}
              </Button>
              <Button onClick={handleSaveAll} disabled={locked || dirtyLines.length === 0 || upsertAll.isPending}>
                {upsertAll.isPending ? <Spinner className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                Save {dirtyLines.length > 0 ? `(${dirtyLines.length})` : "all"}
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Summary label={`${formatDate(date)} production`} value={totals.production} />
            <Summary label="Sales" value={totals.sales} />
            <Summary label="Closing stock" value={totals.closing} />
          </div>

          {isLoading ? (
            <LoadingState />
          ) : isError ? (
            <ErrorState error={error} onRetry={refetch} />
          ) : byBrand.length === 0 ? (
            <EmptyState
              title="No active blankets"
              description="Add and activate blankets to track their daily stock."
            />
          ) : (
            byBrand.map(([brand, brandLines]) => (
              <Card key={brand}>
                <CardContent className="p-0">
                  <div className="flex items-center justify-between border-b px-4 py-3">
                    <h2 className="font-serif text-lg font-semibold text-primary">{brand}</h2>
                    <span className="text-sm text-muted-foreground">{brandLines.length} blankets</span>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Blanket</TableHead>
                        <TableHead>Opening</TableHead>
                        <TableHead>Production</TableHead>
                        <TableHead>Sales</TableHead>
                        <TableHead>Closing</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {brandLines.map((line) => (
                        <StockRowEditor
                          key={line.blanket_id}
                          line={line}
                          values={rowValues[line.blanket_id] ?? initialRowValues(line)}
                          onChange={(field, value) => updateValue(line.blanket_id, field, value)}
                          locked={locked}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="month">
          <StockRollupView
            rows={monthlyRollup.data?.map((r) => ({ ...r, period: r.month }))}
            isLoading={monthlyRollup.isLoading}
            isError={monthlyRollup.isError}
            error={monthlyRollup.error}
            refetch={monthlyRollup.refetch}
            formatPeriod={formatMonth}
            emptyTitle="No monthly history yet"
            emptyDescription="Once you save a few days of stock, monthly totals appear here."
            csvFilenamePrefix="nile-overseas-monthly"
          />
        </TabsContent>

        <TabsContent value="year">
          <StockRollupView
            rows={yearlyRollup.data?.map((r) => ({ ...r, period: r.year }))}
            isLoading={yearlyRollup.isLoading}
            isError={yearlyRollup.isError}
            error={yearlyRollup.error}
            refetch={yearlyRollup.refetch}
            formatPeriod={formatYear}
            emptyTitle="No yearly history yet"
            emptyDescription="Once you save stock across the year, yearly totals appear here."
            csvFilenamePrefix="nile-overseas-yearly"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-sm capitalize text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold text-primary">{formatNumber(value)}</p>
      </CardContent>
    </Card>
  );
}
