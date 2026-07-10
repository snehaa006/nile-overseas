import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  useAgents,
  useCustomers,
  useProductionEntries,
  useAgentMonthly,
  useCustomerMonthly,
  useAddAgent,
  useAddCustomer,
  useDeleteAgent,
  useDeleteCustomer,
  useAddProductionEntry,
  useDeleteProductionEntry,
} from "@/shared/hooks/useProduction";
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
import { dateKey, formatCurrency, formatDate, formatMonth, formatNumber } from "@/shared/utils/format";
import type { Agent, Customer } from "@/shared/types/models";
import type { PartyMonthlyRow } from "@/shared/api/production";

export function ProductionPage() {
  const entries = useProductionEntries();
  const agents = useAgents();
  const customers = useCustomers();
  const agentMonthly = useAgentMonthly();
  const customerMonthly = useCustomerMonthly();
  const deleteEntry = useDeleteProductionEntry();

  const [addOpen, setAddOpen] = useState(false);

  const total = useMemo(
    () => (entries.data ?? []).reduce((s, e) => s + e.amount, 0),
    [entries.data],
  );

  const handleDelete = async (id: string) => {
    try {
      await deleteEntry.mutateAsync(id);
      toast.success("Entry removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove");
    }
  };

  const canAddEntry = (agents.data?.length ?? 0) > 0 && (customers.data?.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-primary">Production</h1>
        <p className="text-muted-foreground">
          Track which agent dispatched how many pieces to which customer.
        </p>
      </div>

      <Tabs defaultValue="entries">
        <TabsList>
          <TabsTrigger value="entries">Entries</TabsTrigger>
          <TabsTrigger value="agent-summary">Agent Summary</TabsTrigger>
          <TabsTrigger value="customer-summary">Customer Summary</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="entries" className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Card className="min-w-48">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total amount</p>
                <p className="mt-1 text-2xl font-bold text-primary">{formatCurrency(total)}</p>
              </CardContent>
            </Card>
            <Button onClick={() => setAddOpen(true)} disabled={!canAddEntry}>
              <Plus className="h-4 w-4" /> Add entry
            </Button>
          </div>

          {!canAddEntry && (
            <p className="text-sm text-muted-foreground">
              Add at least one agent and one customer (in the tabs above) before recording entries.
            </p>
          )}

          {entries.isLoading ? (
            <LoadingState />
          ) : entries.isError ? (
            <ErrorState error={entries.error} onRetry={entries.refetch} />
          ) : (entries.data?.length ?? 0) === 0 ? (
            <EmptyState
              title="No production entries yet"
              description="Record an agent → customer dispatch to get started."
            />
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/60 hover:bg-muted/60">
                      <TableHead className="font-bold text-foreground">Date</TableHead>
                      <TableHead className="font-bold text-foreground">Agent</TableHead>
                      <TableHead className="font-bold text-foreground">Customer</TableHead>
                      <TableHead className="text-right font-bold text-foreground">Amount</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.data!.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="whitespace-nowrap py-3 text-muted-foreground">
                          {formatDate(e.date)}
                        </TableCell>
                        <TableCell className="py-3 font-medium">
                          {e.agent_name ?? <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="py-3">
                          {e.customer_name ?? <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="py-3 text-right font-bold tabular-nums text-emerald-600">
                          {formatCurrency(e.amount)}
                        </TableCell>
                        <TableCell className="py-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(e.id)}
                            disabled={deleteEntry.isPending}
                            aria-label="Delete entry"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="agent-summary">
          <PartyMonthlySummary
            rows={agentMonthly.data}
            isLoading={agentMonthly.isLoading}
            isError={agentMonthly.isError}
            error={agentMonthly.error}
            refetch={agentMonthly.refetch}
            partyLabel="Agent"
            emptyTitle="No agent totals yet"
            emptyDescription="Record production entries to see how much each agent dispatched per month."
          />
        </TabsContent>

        <TabsContent value="customer-summary">
          <PartyMonthlySummary
            rows={customerMonthly.data}
            isLoading={customerMonthly.isLoading}
            isError={customerMonthly.isError}
            error={customerMonthly.error}
            refetch={customerMonthly.refetch}
            partyLabel="Customer"
            emptyTitle="No customer totals yet"
            emptyDescription="Record production entries to see how much each customer received per month."
          />
        </TabsContent>

        <TabsContent value="agents">
          <NameManager
            title="Agents"
            singular="agent"
            items={agents.data}
            isLoading={agents.isLoading}
            isError={agents.isError}
            error={agents.error}
            refetch={agents.refetch}
            useAdd={useAddAgent}
            useDelete={useDeleteAgent}
          />
        </TabsContent>

        <TabsContent value="customers">
          <NameManager
            title="Customers"
            singular="customer"
            items={customers.data}
            isLoading={customers.isLoading}
            isError={customers.isError}
            error={customers.error}
            refetch={customers.refetch}
            useAdd={useAddCustomer}
            useDelete={useDeleteCustomer}
          />
        </TabsContent>
      </Tabs>

      {addOpen && (
        <AddProductionEntryDialog
          agents={agents.data ?? []}
          customers={customers.data ?? []}
          onClose={() => setAddOpen(false)}
        />
      )}
    </div>
  );
}

function AddProductionEntryDialog({
  agents,
  customers,
  onClose,
}: {
  agents: Agent[];
  customers: Customer[];
  onClose: () => void;
}) {
  const addEntry = useAddProductionEntry();
  const [date, setDate] = useState(dateKey());
  const [agentId, setAgentId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [amount, setAmount] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addEntry.mutateAsync({
        date,
        agent_id: agentId,
        customer_id: customerId,
        amount: Number(amount || 0),
      });
      toast.success("Entry added");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add entry");
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add production entry</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Date</Label>
            <DatePicker value={date} onChange={setDate} className="w-full" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="agent">Agent</Label>
            <Select id="agent" value={agentId} onChange={(e) => setAgentId(e.target.value)} required>
              <option value="" disabled>Select an agent…</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="customer">Customer</Label>
            <Select id="customer" value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
              <option value="" disabled>Select a customer…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              required
            />
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

function PartyMonthlySummary({
  rows,
  isLoading,
  isError,
  error,
  refetch,
  partyLabel,
  emptyTitle,
  emptyDescription,
}: {
  rows: PartyMonthlyRow[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
  partyLabel: string;
  emptyTitle: string;
  emptyDescription: string;
}) {
  // Group by month (newest first), each party's total within it sorted high→low.
  const byMonth = useMemo(() => {
    const map = new Map<string, PartyMonthlyRow[]>();
    for (const r of rows ?? []) {
      const arr = map.get(r.month) ?? [];
      arr.push(r);
      map.set(r.month, arr);
    }
    for (const arr of map.values()) arr.sort((a, b) => b.amount - a.amount);
    return [...map.entries()].sort(([a], [b]) => b.localeCompare(a));
  }, [rows]);

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState error={error} onRetry={refetch} />;
  if (!rows || rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="space-y-6">
      {byMonth.map(([month, monthRows]) => {
        const monthTotal = monthRows.reduce((s, r) => s + r.amount, 0);
        return (
          <Card key={month}>
            <CardContent className="p-0">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <h2 className="font-serif text-lg font-semibold text-primary">{formatMonth(month)}</h2>
                <span className="text-sm font-semibold tabular-nums text-primary">
                  {formatCurrency(monthTotal)}
                </span>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/60 hover:bg-muted/60">
                    <TableHead className="font-bold text-foreground">{partyLabel}</TableHead>
                    <TableHead className="text-right font-bold text-foreground">Amount</TableHead>
                    <TableHead className="text-right font-bold text-foreground">Entries</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthRows.map((r) => (
                    <TableRow key={`${month}-${r.id}`}>
                      <TableCell className="py-3 font-medium">{r.name}</TableCell>
                      <TableCell className="py-3 text-right font-bold tabular-nums text-emerald-600">
                        {formatCurrency(r.amount)}
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

type NamedRow = { id: string; name: string };

function NameManager({
  title,
  singular,
  items,
  isLoading,
  isError,
  error,
  refetch,
  useAdd,
  useDelete,
}: {
  title: string;
  singular: string;
  items: NamedRow[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
  useAdd: () => { mutateAsync: (name: string) => Promise<void>; isPending: boolean };
  useDelete: () => { mutateAsync: (id: string) => Promise<void>; isPending: boolean };
}) {
  const add = useAdd();
  const remove = useDelete();
  const [name, setName] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      await add.mutateAsync(trimmed);
      setName("");
      toast.success(`${title.replace(/s$/, "")} added`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add");
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await remove.mutateAsync(id);
      toast.success("Removed");
    } catch (err) {
      toast.error(
        err instanceof Error && /foreign key|violates/i.test(err.message)
          ? `Can't remove a ${singular} that has production entries.`
          : err instanceof Error ? err.message : "Failed to remove",
      );
    }
  };

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <form onSubmit={handleAdd} className="flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`New ${singular} name…`}
          />
          <Button type="submit" disabled={add.isPending || !name.trim()}>
            {add.isPending ? <Spinner className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            Add
          </Button>
        </form>

        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : (items?.length ?? 0) === 0 ? (
          <EmptyState title={`No ${title.toLowerCase()} yet`} description={`Add your first ${singular} above.`} />
        ) : (
          <div className="divide-y rounded-md border">
            {items!.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-4 py-2.5">
                <span className="font-medium">{item.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemove(item.id)}
                  disabled={remove.isPending}
                  aria-label={`Delete ${singular}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
