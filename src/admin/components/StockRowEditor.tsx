import { ArrowDownToLine } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { TableCell, TableRow } from "@/shared/components/ui/table";
import { formatNumber, formatWeight } from "@/shared/utils/format";
import type { DayStockLine } from "@/shared/api/stock";

export type RowValues = { opening: string; production: string; sales: string };

/** Opening is fixed once a row exists (set by the DB trigger from the prior
 * day's closing stock). Before the row exists, we show the carried-forward
 * figure read-only too — it's exactly what will be saved. Only ever
 * editable for a blanket's very first-ever day of data. */
export function isOpeningEditable(line: DayStockLine): boolean {
  return !line.stock && line.priorClosing === null;
}

export function initialRowValues(line: DayStockLine): RowValues {
  const openingValue = line.stock ? Number(line.stock.opening_stock) : (line.priorClosing ?? 0);
  return {
    opening: String(openingValue),
    production: String(line.stock?.production ?? 0),
    sales: String(line.stock?.sales ?? 0),
  };
}

export function isRowDirty(line: DayStockLine, values: RowValues): boolean {
  const savedOpening = line.stock ? Number(line.stock.opening_stock) : (line.priorClosing ?? 0);
  return (
    (isOpeningEditable(line) && Number(values.opening || 0) !== savedOpening) ||
    Number(values.production || 0) !== Number(line.stock?.production ?? 0) ||
    Number(values.sales || 0) !== Number(line.stock?.sales ?? 0)
  );
}

export function StockRowEditor({
  line,
  values,
  onChange,
  editing,
}: {
  line: DayStockLine;
  values: RowValues;
  onChange: (field: "opening" | "production" | "sales", value: string) => void;
  /** Edit mode is toggled page-wide; outside of it every cell renders as plain table text. */
  editing: boolean;
}) {
  const openingIsEditable = isOpeningEditable(line);
  const openingValue = openingIsEditable ? Number(values.opening || 0) : Number(values.opening);
  const closing = openingValue + Number(values.production || 0) - Number(values.sales || 0);

  return (
    <TableRow>
      <TableCell className="py-4 font-medium">
        {line.name}
        <span className="ml-2 font-mono text-xs text-muted-foreground">{line.sku}</span>
        <span className="ml-2 whitespace-nowrap text-xs text-muted-foreground">
          &middot; {formatWeight(line.weight_kg)}
        </span>
      </TableCell>
      <TableCell className="py-4 text-right">
        {editing && openingIsEditable ? (
          <Input
            type="number"
            value={values.opening}
            onChange={(e) => onChange("opening", e.target.value)}
            className="ml-auto h-9 w-24 text-right"
          />
        ) : openingIsEditable ? (
          <span className="tabular-nums text-muted-foreground">{formatNumber(openingValue)}</span>
        ) : (
          <span
            title="Carried forward from the previous day's closing stock"
            className="inline-flex h-9 items-center gap-1 rounded-md border border-dashed bg-muted/40 px-3 text-sm tabular-nums text-muted-foreground"
          >
            <ArrowDownToLine className="h-3 w-3 shrink-0" />
            {formatNumber(openingValue)}
          </span>
        )}
      </TableCell>
      <TableCell className="py-4 text-right">
        {editing ? (
          <Input
            type="number"
            value={values.production}
            onChange={(e) => onChange("production", e.target.value)}
            className="ml-auto h-9 w-24 text-right"
          />
        ) : (
          <span className="tabular-nums">{formatNumber(Number(values.production || 0))}</span>
        )}
      </TableCell>
      <TableCell className="py-4 text-right">
        {editing ? (
          <Input
            type="number"
            value={values.sales}
            onChange={(e) => onChange("sales", e.target.value)}
            className="ml-auto h-9 w-24 text-right"
          />
        ) : (
          <span className="tabular-nums text-amber-600">{formatNumber(Number(values.sales || 0))}</span>
        )}
      </TableCell>
      <TableCell className="py-4 text-right font-bold tabular-nums text-emerald-600">
        {formatNumber(closing)}
      </TableCell>
    </TableRow>
  );
}
