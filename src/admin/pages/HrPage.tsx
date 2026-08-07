import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, Plus, Search, UserRound } from "lucide-react";
import {
  useAdvances,
  useAttendanceMonth,
  useEmployees,
  usePayrollMonth,
} from "@/shared/hooks/useHr";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/shared/components/ui/table";
import { LoadingState, ErrorState, EmptyState } from "@/shared/components/StateViews";
import { dateKey, formatCurrency, formatMonth } from "@/shared/utils/format";
import { cn } from "@/shared/utils/cn";
import {
  calcPayroll,
  DEFAULT_WORKING_DAYS,
  type Employee,
  type PayrollRow,
} from "@/shared/types/models";

/**
 * The roster: search and a table, nothing else. Everything about a worker —
 * attendance, overtime, advances, pay — lives on their own page.
 */
export function HrPage() {
  const month = dateKey().slice(0, 7);
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const { data: employees, isLoading, isError, error, refetch } = useEmployees();
  const { data: records } = useAttendanceMonth(month);
  const { data: advances } = useAdvances(month);
  const { data: payrollMonth } = usePayrollMonth(month);

  const workingDays = payrollMonth?.working_days ?? DEFAULT_WORKING_DAYS;
  const roster = employees ?? [];

  const rows = useMemo(() => {
    const blank = () => ({ present: 0, absent: 0, hours: 0, overtime: 0 });
    const tally = new Map(roster.map((e) => [e.id, blank()]));
    for (const record of records ?? []) {
      const entry = tally.get(record.employee_id);
      if (!entry) continue;
      if (record.status === "present") entry.present += 1;
      else entry.absent += 1;
      entry.hours += Number(record.hours_worked);
      entry.overtime += Number(record.overtime_hours);
    }
    const advanceById = new Map((advances ?? []).map((a) => [a.employee_id, a]));
    return roster.map((employee) => {
      const entry = tally.get(employee.id) ?? blank();
      const advance = advanceById.get(employee.id);
      return calcPayroll({
        employee,
        workingDays,
        presentDays: entry.present,
        absentDays: entry.absent,
        hoursWorked: entry.hours,
        overtimeHours: entry.overtime,
        cashAdvance: Number(advance?.cash_advance ?? 0),
        bankAdvance: Number(advance?.bank_advance ?? 0),
      });
    });
  }, [roster, records, advances, workingDays]);

  const shown = rows.filter((row) => matches(row.employee, query));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-bold text-primary">HR</h1>
        <Button asChild>
          <Link to="/admin/hr/new">
            <Plus className="h-4 w-4" /> Add Worker
          </Link>
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search workers…"
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : roster.length === 0 ? (
        <EmptyState
          title="No workers yet"
          description="Add your first worker to get started."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Worker</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead className="text-right">Salary</TableHead>
                <TableHead className="text-right">
                  Present · {formatMonth(`${month}-01`)}
                </TableHead>
                <TableHead className="text-right">Advance</TableHead>
                <TableHead className="text-right">Net payable</TableHead>
                <TableHead className="w-[1%]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((row) => (
                <WorkerRow
                  key={row.employee.id}
                  row={row}
                  workingDays={workingDays}
                  onOpen={() => navigate(`/admin/hr/${row.employee.id}`)}
                />
              ))}
              {shown.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    No worker matches “{query}”.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function WorkerRow({
  row,
  workingDays,
  onOpen,
}: {
  row: PayrollRow;
  workingDays: number;
  onOpen: () => void;
}) {
  const { employee } = row;

  return (
    <TableRow
      onClick={onOpen}
      className="group cursor-pointer"
      title={`Open ${employee.name}`}
    >
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
            {initials(employee.name) || <UserRound className="h-4 w-4" />}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium">{employee.name}</p>
            <p className="font-mono text-xs text-muted-foreground">
              {employee.employee_code}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">{employee.designation}</TableCell>
      <TableCell className="text-right tabular-nums">
        {formatCurrency(employee.salary)}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {row.presentDays}
        <span className="text-muted-foreground">/{workingDays}</span>
      </TableCell>
      <TableCell className="text-right tabular-nums text-muted-foreground">
        {row.advance ? formatCurrency(row.advance) : "—"}
      </TableCell>
      <TableCell
        className={cn(
          "text-right font-semibold tabular-nums",
          row.netPay < 0 && "text-destructive",
        )}
      >
        {formatCurrency(row.netPay)}
      </TableCell>
      <TableCell>
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </TableCell>
    </TableRow>
  );
}

/** "Ramesh Kumar" -> "RK" — the avatar stand-in, we hold no worker photos. */
function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function matches(employee: Employee, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    employee.name.toLowerCase().includes(q) ||
    employee.employee_code.toLowerCase().includes(q) ||
    employee.designation.toLowerCase().includes(q)
  );
}
