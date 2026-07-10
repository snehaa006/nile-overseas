import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Legend, CartesianGrid,
} from "recharts";
import { useMonthlyRollup, useYearlyRollup } from "@/shared/hooks/useStock";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/shared/components/ui/table";
import { LoadingState, ErrorState, EmptyState } from "@/shared/components/StateViews";
import { formatMonth, formatYear, formatNumber } from "@/shared/utils/format";
import { downloadCsv, toCsv } from "@/shared/utils/csv";
import { ReportKpiCard } from "../components/ReportKpiCard";
import { cn } from "@/shared/utils/cn";

const BRAND_COLORS = ["hsl(20 50% 22%)", "hsl(32 55% 52%)", "hsl(200 40% 45%)", "hsl(350 45% 50%)"];

type Granularity = "month" | "year";

export function ReportsPage() {
  const [granularity, setGranularity] = useState<Granularity>("month");
  const monthly = useMonthlyRollup();
  const yearly = useYearlyRollup();
  const active = granularity === "month" ? monthly : yearly;
  const formatPeriod = granularity === "month" ? formatMonth : formatYear;

  const rows = useMemo(() => {
    if (granularity === "month") {
      return (monthly.data ?? []).map((r) => ({ ...r, period: r.month }));
    }
    return (yearly.data ?? []).map((r) => ({ ...r, period: r.year }));
  }, [granularity, monthly.data, yearly.data]);

  const analysis = useMemo(() => {
    if (rows.length === 0) return null;

    const periods = [...new Set(rows.map((r) => r.period))].sort();
    const brands = [...new Set(rows.map((r) => r.brand_name))];

    const trend = periods.map((period) => {
      const periodRows = rows.filter((r) => r.period === period);
      return {
        period: formatPeriod(period),
        production: periodRows.reduce((s, r) => s + r.production, 0),
        sales: periodRows.reduce((s, r) => s + r.sales, 0),
      };
    });

    const recentPeriods = periods.slice(-6);
    const brandTrend = recentPeriods.map((period) => {
      const entry: Record<string, string | number> = { period: formatPeriod(period) };
      for (const brand of brands) {
        entry[brand] = rows
          .filter((r) => r.period === period && r.brand_name === brand)
          .reduce((s, r) => s + r.sales, 0);
      }
      return entry;
    });

    const lastPeriod = periods[periods.length - 1];
    const prevPeriod = periods.length > 1 ? periods[periods.length - 2] : null;
    const sumFor = (period: string | null, key: "production" | "sales" | "closing_stock") =>
      period === null ? null : rows.filter((r) => r.period === period).reduce((s, r) => s + r[key], 0);

    const byBlanket = new Map<string, { name: string; sku: string | null; brand: string; production: number; sales: number }>();
    for (const r of rows) {
      const entry = byBlanket.get(r.blanket_id) ?? { name: r.blanket_name, sku: r.sku, brand: r.brand_name, production: 0, sales: 0 };
      entry.production += r.production;
      entry.sales += r.sales;
      byBlanket.set(r.blanket_id, entry);
    }
    const topProducts = [...byBlanket.values()]
      .map((b) => ({ ...b, sellThrough: b.production > 0 ? (b.sales / b.production) * 100 : 0 }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 8);

    return {
      brands, trend, brandTrend,
      kpis: {
        production: { value: sumFor(lastPeriod, "production") ?? 0, prev: sumFor(prevPeriod, "production") },
        sales: { value: sumFor(lastPeriod, "sales") ?? 0, prev: sumFor(prevPeriod, "sales") },
        closing: { value: sumFor(lastPeriod, "closing_stock") ?? 0, prev: sumFor(prevPeriod, "closing_stock") },
      },
      topProducts,
      lastPeriodLabel: lastPeriod ? formatPeriod(lastPeriod) : "",
    };
  }, [rows, formatPeriod]);

  const handleExport = () => {
    if (rows.length === 0) return;
    const headers = [granularity === "month" ? "Month" : "Year", "Brand", "Blanket", "SKU", "Opening", "Production", "Sales", "Closing"];
    const csvRows = rows.map((r) => [
      formatPeriod(r.period), r.brand_name, r.blanket_name, r.sku,
      r.opening_stock, r.production, r.sales, r.closing_stock,
    ]);
    downloadCsv(`nile-overseas-${granularity}ly-report.csv`, toCsv(headers, csvRows));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-primary">Reports</h1>
          <p className="text-muted-foreground">Production, sales and stock trends across every brand.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border p-0.5">
            <button
              type="button"
              onClick={() => setGranularity("month")}
              className={cn(
                "rounded px-3 py-1 text-sm font-medium transition",
                granularity === "month" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setGranularity("year")}
              className={cn(
                "rounded px-3 py-1 text-sm font-medium transition",
                granularity === "year" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
              )}
            >
              Yearly
            </button>
          </div>
          <Button variant="outline" onClick={handleExport} disabled={rows.length === 0}>
            <Download className="h-4 w-4" /> Export report (CSV)
          </Button>
        </div>
      </div>

      {active.isLoading ? (
        <LoadingState />
      ) : active.isError ? (
        <ErrorState error={active.error} onRetry={active.refetch} />
      ) : !analysis ? (
        <EmptyState
          title="No stock data yet"
          description="Enter daily stock to see reports and charts here."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <ReportKpiCard label={`Production — ${analysis.lastPeriodLabel}`} value={analysis.kpis.production.value} previous={analysis.kpis.production.prev} />
            <ReportKpiCard label={`Sales — ${analysis.lastPeriodLabel}`} value={analysis.kpis.sales.value} previous={analysis.kpis.sales.prev} />
            <ReportKpiCard label={`Closing stock — ${analysis.lastPeriodLabel}`} value={analysis.kpis.closing.value} previous={analysis.kpis.closing.prev} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Production vs Sales trend</CardTitle>
              <CardDescription>All brands combined, across every recorded {granularity}.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analysis.trend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="period" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="production" name="Production" stroke="hsl(20 50% 22%)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="sales" name="Sales" stroke="hsl(32 55% 52%)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sales by brand</CardTitle>
              <CardDescription>
                Last {analysis.brandTrend.length} {granularity === "month" ? "months" : "years"}, side by side.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analysis.brandTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="period" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Legend />
                    {analysis.brands.map((brand, i) => (
                      <Bar key={brand} dataKey={brand} fill={BRAND_COLORS[i % BRAND_COLORS.length]} radius={[4, 4, 0, 0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top blankets, all-time</CardTitle>
              <CardDescription>Ranked by total units sold. Sell-through = sales ÷ production.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Blanket</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead className="text-right">Production</TableHead>
                    <TableHead className="text-right">Sales</TableHead>
                    <TableHead className="text-right">Sell-through</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analysis.topProducts.map((p) => (
                    <TableRow key={p.name + p.sku}>
                      <TableCell className="font-medium">
                        {p.name}
                        <span className="ml-2 font-mono text-xs text-muted-foreground">{p.sku}</span>
                      </TableCell>
                      <TableCell>{p.brand}</TableCell>
                      <TableCell className="text-right">{formatNumber(p.production)}</TableCell>
                      <TableCell className="text-right">{formatNumber(p.sales)}</TableCell>
                      <TableCell className="text-right">{p.sellThrough.toFixed(0)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
