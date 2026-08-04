import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  useProcessDay,
  useProcessMonthly,
  useProcessYearly,
  useAddProcessEntry,
  useDeleteProcessEntry,
} from "@/shared/hooks/useProcess";
import { useBlankets } from "@/shared/hooks/useBlankets";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Select } from "@/shared/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/components/ui/tabs";
import { DatePicker } from "@/shared/components/ui/date-picker";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/shared/components/ui/table";
import { LoadingState, ErrorState, EmptyState, Spinner } from "@/shared/components/StateViews";
import { dateKey, formatDate, formatMonth, formatNumber, formatYear } from "@/shared/utils/format";
import { PROCESSES, PROCESS_LABELS, type Process } from "@/shared/types/models";
import type { ProcessEntryRow, ProcessTotalRow } from "@/shared/api/process";

export function ProcessPage() {
  const [date, setDate] = useState(dateKey());
  const { data: entries, isLoading, isError, error, refetch } = useProcessDay(date);
  const monthly = useProcessMonthly();
  const yearly = useProcessYearly();
  const deleteEntry = useDeleteProcessEntry(date);

  const [dialogProcess, setDialogProcess] = useState<Process | null>(null);

  const byProcess = useMemo(() => {
    const map = new Map<Process, ProcessEntryRow[]>();
    for (const p of PROCESSES) map.set(p, []);
    for (const e of entries ?? []) map.get(e.process)?.push(e);
    return map;
  }, [entries]);

  const handleDelete = async (id: string) => {
    try {
      await deleteEntry.mutateAsync(id);
      toast.success("Entry removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-primary">Process</h1>
      </div>

      <Tabs defaultValue="day">
        <TabsList>
          <TabsTrigger value="day">Daily Entry</TabsTrigger>
          <TabsTrigger value="month">Monthly Totals</TabsTrigger>
          <TabsTrigger value="year">Yearly Totals</TabsTrigger>
        </TabsList>

        <TabsContent value="day" className="space-y-6">
          <DatePicker value={date} onChange={setDate} />

          {isLoading ? (
            <LoadingState />
          ) : isError ? (
            <ErrorState error={error} onRetry={refetch} />
          ) : (
            <div className="space-y-6">
              {PROCESSES.map((process) => {
                const rows = byProcess.get(process) ?? [];
                const totalRoll = rows.reduce((s, r) => s + r.roll, 0);
                const totalKg = rows.reduce((s, r) => s + r.kg, 0);
                return (
                  <Card key={process}>
                    <CardContent className="p-0">
                      <div className="flex items-center justify-between border-b px-4 py-3">
                        <h2 className="font-serif text-lg font-semibold text-primary">
                          {PROCESS_LABELS[process]}
                        </h2>
                        <Button size="sm" onClick={() => setDialogProcess(process)}>
                          <Plus className="h-4 w-4" /> Add entry
                        </Button>
                      </div>
                      {rows.length === 0 ? (
                        <p className="px-4 py-6 text-sm text-muted-foreground">
                          No entries for {formatDate(date)}.
                        </p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/60 hover:bg-muted/60">
                              <TableHead className="font-bold text-foreground">Blanket</TableHead>
                              <TableHead className="text-right font-bold text-foreground">Roll</TableHead>
                              <TableHead className="text-right font-bold text-foreground">Kg</TableHead>
                              <TableHead className="w-12" />
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {rows.map((r) => (
                              <TableRow key={r.id}>
                                <TableCell className="py-3 font-medium">
                                  {r.blanket_name ?? <span className="text-muted-foreground">—</span>}
                                </TableCell>
                                <TableCell className="py-3 text-right tabular-nums">{formatNumber(r.roll)}</TableCell>
                                <TableCell className="py-3 text-right tabular-nums">{formatNumber(r.kg)}</TableCell>
                                <TableCell className="py-3 text-right">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    onClick={() => handleDelete(r.id)}
                                    disabled={deleteEntry.isPending}
                                    aria-label="Delete entry"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="bg-muted/40 hover:bg-muted/40">
                              <TableCell className="py-3 font-bold text-primary">Total</TableCell>
                              <TableCell className="py-3 text-right font-bold tabular-nums text-emerald-600">
                                {formatNumber(totalRoll)}
                              </TableCell>
                              <TableCell className="py-3 text-right font-bold tabular-nums text-emerald-600">
                                {formatNumber(totalKg)}
                              </TableCell>
                              <TableCell />
                            </TableRow>
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="month">
          <ProcessTotalsView
            rows={monthly.data}
            isLoading={monthly.isLoading}
            isError={monthly.isError}
            error={monthly.error}
            refetch={monthly.refetch}
            formatPeriod={formatMonth}
            emptyTitle="No monthly totals yet"
            emptyDescription="Add a few days of process entries and monthly totals will appear here."
          />
        </TabsContent>

        <TabsContent value="year">
          <ProcessTotalsView
            rows={yearly.data}
            isLoading={yearly.isLoading}
            isError={yearly.isError}
            error={yearly.error}
            refetch={yearly.refetch}
            formatPeriod={formatYear}
            emptyTitle="No yearly totals yet"
            emptyDescription="Once you record process entries across the year, yearly totals appear here."
          />
        </TabsContent>
      </Tabs>

      {dialogProcess && (
        <AddProcessEntryDialog
          process={dialogProcess}
          date={date}
          onClose={() => setDialogProcess(null)}
        />
      )}
    </div>
  );
}

function AddProcessEntryDialog({
  process,
  date,
  onClose,
}: {
  process: Process;
  date: string;
  onClose: () => void;
}) {
  const { data: blankets } = useBlankets();
  const activeBlankets = useMemo(
    () => (blankets ?? []).filter((b) => b.is_active),
    [blankets],
  );
  const addEntry = useAddProcessEntry(date);

  const [blanketId, setBlanketId] = useState("");
  const [roll, setRoll] = useState("");
  const [kg, setKg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addEntry.mutateAsync({
        date,
        process,
        blanket_id: blanketId || null,
        roll: Number(roll || 0),
        kg: Number(kg || 0),
      });
      toast.success(`Entry added to ${PROCESS_LABELS[process]}`);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add entry");
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add {PROCESS_LABELS[process]} entry</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="blanket">Blanket</Label>
            <Select
              id="blanket"
              value={blanketId}
              onChange={(e) => setBlanketId(e.target.value)}
              required
            >
              <option value="" disabled>Select a blanket…</option>
              {activeBlankets.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="roll">Roll</Label>
              <Input
                id="roll"
                type="number"
                min="0"
                step="any"
                value={roll}
                onChange={(e) => setRoll(e.target.value)}
                placeholder="0"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="kg">Kg</Label>
              <Input
                id="kg"
                type="number"
                min="0"
                step="any"
                value={kg}
                onChange={(e) => setKg(e.target.value)}
                placeholder="0"
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={addEntry.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={addEntry.isPending}>
              {addEntry.isPending ? <Spinner className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              Add
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ProcessTotalsView({
  rows,
  isLoading,
  isError,
  error,
  refetch,
  formatPeriod,
  emptyTitle,
  emptyDescription,
}: {
  rows: ProcessTotalRow[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
  formatPeriod: (period: string) => string;
  emptyTitle: string;
  emptyDescription: string;
}) {
  const byProcess = useMemo(() => {
    const map = new Map<Process, ProcessTotalRow[]>();
    for (const p of PROCESSES) map.set(p, []);
    for (const r of rows ?? []) map.get(r.process)?.push(r);
    return map;
  }, [rows]);

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState error={error} onRetry={refetch} />;
  if (!rows || rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="space-y-6">
      {PROCESSES.map((process) => {
        const periods = byProcess.get(process) ?? [];
        if (periods.length === 0) return null;
        return (
          <Card key={process}>
            <CardContent className="p-0">
              <div className="border-b px-4 py-3">
                <h2 className="font-serif text-lg font-semibold text-primary">
                  {PROCESS_LABELS[process]}
                </h2>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/60 hover:bg-muted/60">
                    <TableHead className="font-bold text-foreground">Period</TableHead>
                    <TableHead className="text-right font-bold text-foreground">Roll</TableHead>
                    <TableHead className="text-right font-bold text-foreground">Kg</TableHead>
                    <TableHead className="text-right font-bold text-foreground">Entries</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {periods.map((r) => (
                    <TableRow key={r.period}>
                      <TableCell className="py-3 text-muted-foreground">{formatPeriod(r.period)}</TableCell>
                      <TableCell className="py-3 text-right font-bold tabular-nums text-emerald-600">
                        {formatNumber(r.roll)}
                      </TableCell>
                      <TableCell className="py-3 text-right font-bold tabular-nums text-emerald-600">
                        {formatNumber(r.kg)}
                      </TableCell>
                      <TableCell className="py-3 text-right tabular-nums text-muted-foreground">
                        {formatNumber(r.entries)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
