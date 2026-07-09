import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { formatNumber } from "@/shared/utils/format";
import { cn } from "@/shared/utils/cn";

export function ReportKpiCard({
  label,
  value,
  previous,
}: {
  label: string;
  value: number;
  previous: number | null;
}) {
  const change = previous !== null && previous !== 0 ? ((value - previous) / previous) * 100 : null;
  const isUp = (change ?? 0) > 0;
  const isFlat = change === null || Math.abs(change) < 0.5;

  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold text-primary">{formatNumber(value)}</p>
        {change !== null && (
          <div
            className={cn(
              "mt-2 inline-flex items-center gap-1 text-xs font-medium",
              isFlat ? "text-muted-foreground" : isUp ? "text-emerald-600" : "text-destructive",
            )}
          >
            {isFlat ? <Minus className="h-3 w-3" /> : isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(change).toFixed(1)}% vs last month
          </div>
        )}
      </CardContent>
    </Card>
  );
}
