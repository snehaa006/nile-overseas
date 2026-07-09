import { useEffect, useState } from "react";
import { Check, Lock } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { TableCell, TableRow } from "@/shared/components/ui/table";
import { Spinner } from "@/shared/components/StateViews";
import { formatNumber } from "@/shared/utils/format";
import type { MonthStockLine } from "@/shared/api/stock";
import { useUpsertStock } from "@/shared/hooks/useStock";

export function StockRowEditor({
  line,
  month,
  locked,
}: {
  line: MonthStockLine;
  month: string;
  locked: boolean;
}) {
  const upsert = useUpsertStock(month);
  const [opening, setOpening] = useState(String(line.stock?.opening_stock ?? 0));
  const [production, setProduction] = useState(String(line.stock?.production ?? 0));
  const [sales, setSales] = useState(String(line.stock?.sales ?? 0));

  useEffect(() => {
    setOpening(String(line.stock?.opening_stock ?? 0));
    setProduction(String(line.stock?.production ?? 0));
    setSales(String(line.stock?.sales ?? 0));
  }, [line.stock]);

  const closing = Number(opening || 0) + Number(production || 0) - Number(sales || 0);
  const dirty =
    Number(opening || 0) !== Number(line.stock?.opening_stock ?? 0) ||
    Number(production || 0) !== Number(line.stock?.production ?? 0) ||
    Number(sales || 0) !== Number(line.stock?.sales ?? 0);

  const save = async () => {
    try {
      await upsert.mutateAsync({
        blanket_id: line.blanket_id,
        month,
        opening_stock: Number(opening || 0),
        production: Number(production || 0),
        sales: Number(sales || 0),
      });
      toast.success(`Saved ${line.name}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  };

  const cell = (value: string, set: (v: string) => void) => (
    <Input
      type="number"
      value={value}
      disabled={locked}
      onChange={(e) => set(e.target.value)}
      className="h-9 w-24"
    />
  );

  return (
    <TableRow>
      <TableCell className="font-medium">
        {line.name}
        <span className="ml-2 font-mono text-xs text-muted-foreground">{line.sku}</span>
      </TableCell>
      <TableCell>{cell(opening, setOpening)}</TableCell>
      <TableCell>{cell(production, setProduction)}</TableCell>
      <TableCell>{cell(sales, setSales)}</TableCell>
      <TableCell className="font-semibold">{formatNumber(closing)}</TableCell>
      <TableCell className="text-right">
        {locked ? (
          <Lock className="ml-auto h-4 w-4 text-muted-foreground" />
        ) : (
          <Button size="sm" variant={dirty ? "default" : "outline"} disabled={!dirty || upsert.isPending} onClick={save}>
            {upsert.isPending ? <Spinner className="h-3 w-3" /> : <Check className="h-3 w-3" />} Save
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}
