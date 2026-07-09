import { useMemo, useState } from "react";
import { Lock, Unlock } from "lucide-react";
import { toast } from "sonner";
import { useMonthStock, useToggleMonthLock } from "@/shared/hooks/useStock";
import { StockRowEditor } from "../components/StockRowEditor";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent } from "@/shared/components/ui/card";
import {
  Table, TableBody, TableHead, TableHeader, TableRow,
} from "@/shared/components/ui/table";
import { LoadingState, ErrorState, EmptyState } from "@/shared/components/StateViews";
import { formatMonth, formatNumber, monthKey } from "@/shared/utils/format";
import type { MonthStockLine } from "@/shared/api/stock";

export function MonthlyStockPage() {
  const [monthInput, setMonthInput] = useState(monthKey().slice(0, 7)); // YYYY-MM
  const month = `${monthInput}-01`;
  const { data: lines, isLoading, isError, error, refetch } = useMonthStock(month);
  const toggleLock = useToggleMonthLock(month);

  const locked = useMemo(
    () => Boolean(lines?.some((l) => l.stock?.is_locked)),
    [lines],
  );

  const byBrand = useMemo(() => {
    const map = new Map<string, MonthStockLine[]>();
    for (const line of lines ?? []) {
      const arr = map.get(line.brand_name) ?? [];
      arr.push(line);
      map.set(line.brand_name, arr);
    }
    return [...map.entries()];
  }, [lines]);

  const totals = useMemo(() => {
    return (lines ?? []).reduce(
      (acc, l) => {
        acc.production += Number(l.stock?.production ?? 0);
        acc.sales += Number(l.stock?.sales ?? 0);
        acc.closing += Number(l.stock?.closing_stock ?? 0);
        return acc;
      },
      { production: 0, sales: 0, closing: 0 },
    );
  }, [lines]);

  const hasAnyData = Boolean(lines?.some((l) => l.stock));

  const handleLock = async () => {
    if (!hasAnyData) {
      toast.error("Add stock data before locking the month.");
      return;
    }
    try {
      await toggleLock.mutateAsync(!locked);
      toast.success(locked ? "Month unlocked" : "Month locked");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-primary">Monthly Stock</h1>
          <p className="text-muted-foreground">
            Opening + Production − Sales = Closing (auto-calculated).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={monthInput}
            onChange={(e) => setMonthInput(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          />
          {locked ? (
            <Badge variant="muted"><Lock className="mr-1 h-3 w-3" /> Locked</Badge>
          ) : (
            <Badge variant="success">Open</Badge>
          )}
          <Button variant="outline" onClick={handleLock} disabled={toggleLock.isPending}>
            {locked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            {locked ? "Unlock" : "Lock month"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Summary label={`${formatMonth(month)} production`} value={totals.production} />
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
          description="Add and activate blankets to track their monthly stock."
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
                    <TableHead className="text-right">Save</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {brandLines.map((line) => (
                    <StockRowEditor
                      key={line.blanket_id}
                      line={line}
                      month={month}
                      locked={locked}
                    />
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
