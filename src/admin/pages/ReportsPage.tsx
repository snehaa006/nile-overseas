import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from "recharts";
import { useProductMonthlySummary } from "@/shared/hooks/useStock";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/shared/components/ui/table";
import { LoadingState, ErrorState, EmptyState } from "@/shared/components/StateViews";
import { formatMonth, formatNumber } from "@/shared/utils/format";

export function ReportsPage() {
  const { data: rows, isLoading, isError, error, refetch } = useProductMonthlySummary();

  const chartData = useMemo(() => {
    const byMonth = new Map<string, { month: string; production: number; sales: number }>();
    for (const r of rows ?? []) {
      if (!r.month) continue;
      const entry = byMonth.get(r.month) ?? {
        month: formatMonth(r.month),
        production: 0,
        sales: 0,
      };
      entry.production += Number(r.total_production ?? 0);
      entry.sales += Number(r.total_sales ?? 0);
      byMonth.set(r.month, entry);
    }
    return [...byMonth.values()].reverse();
  }, [rows]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-primary">Reports</h1>
        <p className="text-muted-foreground">Production and sales by brand, month over month.</p>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : !rows || rows.length === 0 ? (
        <EmptyState
          title="No stock data yet"
          description="Enter monthly stock to see reports and charts here."
        />
      ) : (
        <>
          <Card>
            <CardHeader><CardTitle className="text-base">Production vs Sales</CardTitle></CardHeader>
            <CardContent>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="production" name="Production" fill="hsl(20 50% 22%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="sales" name="Sales" fill="hsl(32 55% 52%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Monthly summary by brand</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead className="text-right">Production</TableHead>
                    <TableHead className="text-right">Sales</TableHead>
                    <TableHead className="text-right">Closing stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, i) => (
                    <TableRow key={`${r.product_id}-${r.month}-${i}`}>
                      <TableCell>{r.month ? formatMonth(r.month) : "—"}</TableCell>
                      <TableCell className="font-medium">{r.product_name}</TableCell>
                      <TableCell className="text-right">{formatNumber(r.total_production)}</TableCell>
                      <TableCell className="text-right">{formatNumber(r.total_sales)}</TableCell>
                      <TableCell className="text-right">{formatNumber(r.total_stock)}</TableCell>
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
