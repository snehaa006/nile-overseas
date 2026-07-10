import { useEffect, useState } from "react";
import { Check, Lock, ArrowDownToLine } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { TableCell, TableRow } from "@/shared/components/ui/table";
import { Spinner } from "@/shared/components/StateViews";
import { formatNumber } from "@/shared/utils/format";
import type { DayStockLine } from "@/shared/api/stock";
import { useUpsertStock } from "@/shared/hooks/useStock";

export function StockRowEditor({
  line,
  date,
  locked,
}: {
  line: DayStockLine;
  date: string;
  locked: boolean;
}) {
  const upsert = useUpsertStock(date);

  // Opening is fixed once a row exists (set by the DB trigger from the prior
  // day's closing stock). Before the row exists, we show the carried-
  // forward figure read-only too — it's exactly what will be saved.
  const rowExists = Boolean(line.stock);
  const openingValue = rowExists
    ? Number(line.stock!.opening_stock)
    : (line.priorClosing ?? 0);
  const openingIsEditable = !rowExists && line.priorClosing === null;

  const [openingInput, setOpeningInput] = useState(String(openingValue));
  const [production, setProduction] = useState(String(line.stock?.production ?? 0));
  const [sales, setSales] = useState(String(line.stock?.sales ?? 0));

  useEffect(() => {
    setOpeningInput(String(openingValue));
    setProduction(String(line.stock?.production ?? 0));
    setSales(String(line.stock?.sales ?? 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line.stock, line.priorClosing]);

  const opening = openingIsEditable ? Number(openingInput || 0) : openingValue;
  const closing = opening + Number(production || 0) - Number(sales || 0);
  const dirty =
    (openingIsEditable && Number(openingInput || 0) !== Number(line.stock?.opening_stock ?? 0)) ||
    Number(production || 0) !== Number(line.stock?.production ?? 0) ||
    Number(sales || 0) !== Number(line.stock?.sales ?? 0);

  const save = async () => {
    try {
      await upsert.mutateAsync({
        blanket_id: line.blanket_id,
        date,
        opening_stock: opening,
        production: Number(production || 0),
        sales: Number(sales || 0),
      });
      toast.success(`Saved ${line.name}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  };

  return (
    <TableRow>
      <TableCell className="font-medium">
        {line.name}
        <span className="ml-2 font-mono text-xs text-muted-foreground">{line.sku}</span>
      </TableCell>
      <TableCell>
        {openingIsEditable ? (
          <Input
            type="number"
            value={openingInput}
            disabled={locked}
            onChange={(e) => setOpeningInput(e.target.value)}
            className="h-9 w-24"
          />
        ) : (
          <span
            title="Carried forward from the previous day's closing stock"
            className="inline-flex h-9 w-24 items-center gap-1 rounded-md border border-dashed bg-muted/40 px-3 text-sm text-muted-foreground"
          >
            <ArrowDownToLine className="h-3 w-3 shrink-0" />
            {formatNumber(openingValue)}
          </span>
        )}
      </TableCell>
      <TableCell>
        <Input
          type="number"
          value={production}
          disabled={locked}
          onChange={(e) => setProduction(e.target.value)}
          className="h-9 w-24"
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          value={sales}
          disabled={locked}
          onChange={(e) => setSales(e.target.value)}
          className="h-9 w-24"
        />
      </TableCell>
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
