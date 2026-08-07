import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  CalendarRange, CircleSlash, Pencil, Plus, Search, Trash2, UserRound,
} from "lucide-react";
import {
  useAttendance,
  useAttendanceMonth,
  useClearAttendance,
  useDeleteEmployee,
  useEmployees,
  useMarkAllAttendance,
  useMarkAttendance,
  useAdvances,
  usePayrollMonth,
  useSaveAdvance,
  useSavePayrollMonth,
  useSetHoursWorked,
  useSetOvertime,
} from "@/shared/hooks/useHr";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { DatePicker } from "@/shared/components/ui/date-picker";
import { MonthPicker } from "@/shared/components/ui/month-picker";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/shared/components/ui/table";
import { LoadingState, ErrorState, EmptyState, Spinner } from "@/shared/components/StateViews";
import { AttendanceToggle } from "../components/AttendanceToggle";
import { InlineNumberInput } from "../components/InlineNumberInput";
import { dateKey, formatCurrency, formatCurrencyExact } from "@/shared/utils/format";
import { cn } from "@/shared/utils/cn";
import {
  calcPayroll,
  DEFAULT_WORKING_DAYS,
  type AttendanceRecord,
  type AttendanceStatus,
  type Employee,
  type PayrollRow,
} from "@/shared/types/models";

/** Workforce roster plus day-by-day attendance marking. */
export function HrPage() {
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

      <Tabs defaultValue="workers">
        <TabsList>
          <TabsTrigger value="workers">Workers</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
        </TabsList>

        <TabsContent value="workers">
          <WorkersTab />
        </TabsContent>
        <TabsContent value="attendance">
          <AttendanceTab />
        </TabsContent>
        <TabsContent value="payroll">
          <PayrollTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* -------------------------------- Shared -------------------------------- */

/** "Ramesh Kumar" -> "RK" — the avatar stand-in, we hold no worker photos. */
function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function EmployeeCell({ employee }: { employee: Employee }) {
  return (
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
  );
}

/** A compact figure tile — the counts above each tab's table. */
function Tile({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  tone?: "neutral" | "present" | "absent";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3",
        tone === "present" && "border-emerald-200 bg-emerald-50",
        tone === "absent" && "border-rose-200 bg-rose-50",
        tone === "neutral" && "bg-card",
      )}
    >
      <p
        className={cn(
          "text-xs font-medium uppercase tracking-wide",
          tone === "present" && "text-emerald-700",
          tone === "absent" && "text-rose-700",
          tone === "neutral" && "text-muted-foreground",
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 text-2xl font-bold",
          tone === "present" && "text-emerald-800",
          tone === "absent" && "text-rose-800",
          tone === "neutral" && "text-primary",
        )}
      >
        {value}
      </p>
    </div>
  );
}

/** Name, employee ID or designation — one box, used on both tables. */
function WorkerSearchField({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="relative max-w-sm">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search workers…"
        className="pl-9"
      />
    </div>
  );
}

function filterWorkers(roster: Employee[], query: string): Employee[] {
  const q = query.trim().toLowerCase();
  if (!q) return roster;
  return roster.filter(
    (e) =>
      e.name.toLowerCase().includes(q) ||
      e.employee_code.toLowerCase().includes(q) ||
      e.designation.toLowerCase().includes(q),
  );
}

/* ------------------------------- Workers -------------------------------- */

function WorkersTab() {
  const { data: employees, isLoading, isError, error, refetch } = useEmployees();
  const [query, setQuery] = useState("");
  const roster = employees ?? [];
  const payroll = roster.reduce((sum, e) => sum + Number(e.salary), 0);
  const shown = filterWorkers(roster, query);

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState error={error} onRetry={refetch} />;
  if (roster.length === 0) {
    return (
      <EmptyState
        title="No workers yet"
        description="Add your first worker to get started."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <Tile label="Workers" value={roster.length} />
        <Tile label="Monthly payroll" value={formatCurrency(payroll)} />
      </div>

      <WorkerSearchField value={query} onChange={setQuery} />

      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>Worker</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead className="text-right">Salary</TableHead>
              <TableHead className="w-[1%]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((employee) => (
              <WorkerRow key={employee.id} employee={employee} />
            ))}
            {shown.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  No worker matches “{query}”.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function WorkerRow({ employee }: { employee: Employee }) {
  const remove = useDeleteEmployee();

  const handleRemove = async () => {
    if (!confirm(`Remove ${employee.name} (${employee.employee_code})?`)) return;
    try {
      await remove.mutateAsync(employee.id);
      toast.success(`${employee.name} removed`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Remove failed");
    }
  };

  return (
    <TableRow className="group">
      <TableCell>
        <EmployeeCell employee={employee} />
      </TableCell>
      <TableCell className="text-muted-foreground">{employee.designation}</TableCell>
      <TableCell className="text-right font-medium tabular-nums">
        {formatCurrency(employee.salary)}
      </TableCell>
      <TableCell>
        <div className="flex justify-end gap-1.5 opacity-60 transition-opacity group-hover:opacity-100">
          <Button size="icon" variant="ghost" title="Month attendance" asChild>
            <Link to={`/admin/hr/${employee.id}/attendance`}>
              <CalendarRange className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="icon" variant="ghost" title="Edit worker" asChild>
            <Link to={`/admin/hr/${employee.id}`}>
              <Pencil className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            title="Remove worker"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={handleRemove}
            disabled={remove.isPending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

/* ------------------------------ Attendance ------------------------------ */

function AttendanceTab() {
  const [date, setDate] = useState(dateKey());
  const { data: employees, isLoading, isError, error, refetch } = useEmployees();
  const { data: records } = useAttendance(date);
  const markAll = useMarkAllAttendance(date);

  const recordById = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    for (const record of records ?? []) map.set(record.employee_id, record);
    return map;
  }, [records]);

  const [query, setQuery] = useState("");
  const roster = filterWorkers(employees ?? [], query);
  const statusOf = (id: string) => recordById.get(id)?.status;
  const all = employees ?? [];
  const present = all.filter((e) => statusOf(e.id) === "present").length;
  const absent = all.filter((e) => statusOf(e.id) === "absent").length;
  const unmarked = all.length - present - absent;

  const handleMarkAll = async (status: AttendanceStatus) => {
    try {
      await markAll.mutateAsync({ employees: all, status });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to mark attendance");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DatePicker value={date} onChange={setDate} />
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Mark all</span>
          <Button
            size="sm"
            variant="outline"
            className="w-10 font-semibold text-emerald-700 hover:bg-emerald-50"
            title="Mark everyone present"
            onClick={() => handleMarkAll("present")}
            disabled={markAll.isPending || all.length === 0}
          >
            {markAll.isPending ? <Spinner className="h-4 w-4" /> : "P"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="w-10 font-semibold text-rose-700 hover:bg-rose-50"
            title="Mark everyone absent"
            onClick={() => handleMarkAll("absent")}
            disabled={markAll.isPending || all.length === 0}
          >
            {markAll.isPending ? <Spinner className="h-4 w-4" /> : "A"}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : all.length === 0 ? (
        <EmptyState title="No workers yet" description="Add a worker first." />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Tile label="Present" value={present} tone="present" />
            <Tile label="Absent" value={absent} tone="absent" />
            <Tile label="Not marked" value={unmarked} />
          </div>

          <WorkerSearchField value={query} onChange={setQuery} />

          <div className="overflow-hidden rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>Worker</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead className="w-[1%] text-center">Hours</TableHead>
                  <TableHead className="w-[1%] text-center">OT hrs</TableHead>
                  <TableHead className="w-[1%] text-right">P / A</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roster.map((employee) => (
                  <AttendanceRow
                    key={employee.id}
                    employee={employee}
                    date={date}
                    record={recordById.get(employee.id)}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}

function AttendanceRow({
  employee,
  date,
  record,
}: {
  employee: Employee;
  date: string;
  record?: AttendanceRecord;
}) {
  const status = record?.status;
  const mark = useMarkAttendance(date);
  const clear = useClearAttendance(date);
  const setHours = useSetHoursWorked(date);
  const setOvertime = useSetOvertime(date);
  const busy = mark.isPending || clear.isPending;

  /** Tapping the letter that is already lit clears the mark instead. */
  const toggle = async (next: AttendanceStatus) => {
    try {
      if (status === next) await clear.mutateAsync(employee.id);
      else
        await mark.mutateAsync({
          employeeId: employee.id,
          status: next,
          shiftHours: Number(employee.shift_hours),
        });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save attendance");
    }
  };

  return (
    <TableRow
      className={cn(
        status === "present" && "bg-emerald-50/50",
        status === "absent" && "bg-rose-50/50",
      )}
    >
      <TableCell>
        <EmployeeCell employee={employee} />
      </TableCell>
      <TableCell className="text-muted-foreground">{employee.designation}</TableCell>
      <TableCell className="text-center">
        <InlineNumberInput
          value={Number(record?.hours_worked ?? 0)}
          disabled={status !== "present"}
          onCommit={(hours) =>
            setHours.mutateAsync({ employeeId: employee.id, hours }).then(() => {})
          }
        />
      </TableCell>
      <TableCell className="text-center">
        <InlineNumberInput
          value={Number(record?.overtime_hours ?? 0)}
          disabled={status !== "present"}
          onCommit={(hours) =>
            setOvertime.mutateAsync({ employeeId: employee.id, hours }).then(() => {})
          }
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-2">
          {!status && (
            <CircleSlash className="hidden h-4 w-4 text-muted-foreground sm:block" />
          )}
          <AttendanceToggle
            status={status}
            onToggle={toggle}
            disabled={busy}
            label={employee.name}
          />
        </div>
      </TableCell>
    </TableRow>
  );
}

/* ------------------------------- Payroll -------------------------------- */

function PayrollTab() {
  const [month, setMonth] = useState(dateKey().slice(0, 7));
  const [query, setQuery] = useState("");
  const { data: employees, isLoading, isError, error, refetch } = useEmployees();
  const { data: records } = useAttendanceMonth(month);
  const { data: payrollMonth } = usePayrollMonth(month);
  const { data: advances } = useAdvances(month);

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
    const advanceById = new Map(
      (advances ?? []).map((a) => [a.employee_id, Number(a.amount)]),
    );
    return roster.map((employee) => {
      const entry = tally.get(employee.id) ?? blank();
      return calcPayroll({
        employee,
        workingDays,
        presentDays: entry.present,
        absentDays: entry.absent,
        hoursWorked: entry.hours,
        overtimeHours: entry.overtime,
        advance: advanceById.get(employee.id) ?? 0,
      });
    });
  }, [roster, records, advances, workingDays]);

  const shown = rows.filter((r) => filterWorkers([r.employee], query).length > 0);
  const totalAdvance = rows.reduce((sum, r) => sum + r.advance, 0);
  const totalNet = rows.reduce((sum, r) => sum + r.netPay, 0);
  const totalHours = rows.reduce((sum, r) => sum + r.hoursWorked, 0);
  const totalOvertime = rows.reduce((sum, r) => sum + r.overtimeHours, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <MonthPicker value={month} onChange={setMonth} />
        <WorkingDaysField month={month} workingDays={workingDays} />
      </div>

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : roster.length === 0 ? (
        <EmptyState title="No workers yet" description="Add a worker first." />
      ) : (
        <>
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            <Tile label="Hours worked" value={totalHours} />
            <Tile label="Overtime hours" value={totalOvertime} />
            <Tile label="Advances" value={formatCurrency(totalAdvance)} />
            <Tile label="Net payable" value={formatCurrency(totalNet)} />
          </div>

          <WorkerSearchField value={query} onChange={setQuery} />

          <div className="overflow-hidden rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>Worker</TableHead>
                  <TableHead className="text-right">Present</TableHead>
                  <TableHead className="text-right">Hours</TableHead>
                  <TableHead className="text-right">OT hrs</TableHead>
                  <TableHead className="text-right">Earned</TableHead>
                  <TableHead className="w-[1%] text-center">Advance</TableHead>
                  <TableHead className="text-right">Net payable</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shown.map((row) => (
                  <PayrollRowView
                    key={row.employee.id}
                    row={row}
                    month={month}
                    workingDays={workingDays}
                  />
                ))}
                {shown.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      No worker matches “{query}”.
                    </TableCell>
                  </TableRow>
                )}
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableCell colSpan={5} className="font-medium">
                    Total
                  </TableCell>
                  <TableCell className="text-center font-medium tabular-nums text-amber-700">
                    {totalAdvance ? formatCurrency(totalAdvance) : "—"}
                  </TableCell>
                  <TableCell className="text-right font-bold tabular-nums">
                    {formatCurrencyExact(totalNet)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * One worker's month. Rates live under the name rather than in their own
 * columns — the table has to stay readable now that advances are in it.
 */
function PayrollRowView({
  row,
  month,
  workingDays,
}: {
  row: PayrollRow;
  month: string;
  workingDays: number;
}) {
  const saveAdvance = useSaveAdvance(month);

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
            {initials(row.employee.name) || <UserRound className="h-4 w-4" />}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium">{row.employee.name}</p>
            <p
              className="text-xs text-muted-foreground"
              title={`Day rate ${formatCurrencyExact(row.dayRate)} over a ${row.employee.shift_hours}h shift`}
            >
              {formatCurrencyExact(row.hourlyRate)}/hr
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {row.presentDays}
        <span className="text-muted-foreground">/{workingDays}</span>
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {row.hoursWorked || "—"}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {row.overtimeHours || "—"}
      </TableCell>
      <TableCell className="text-right tabular-nums text-muted-foreground">
        {formatCurrencyExact(row.totalPay)}
      </TableCell>
      <TableCell className="text-center">
        <InlineNumberInput
          value={row.advance}
          min={0}
          max={10_000_000}
          step="100"
          className="w-28"
          placeholder="0"
          invalidMessage="Enter a valid advance amount"
          onCommit={(amount) =>
            saveAdvance
              .mutateAsync({ employeeId: row.employee.id, amount })
              .then(() => {})
          }
        />
      </TableCell>
      <TableCell
        className={cn(
          "text-right font-semibold tabular-nums",
          row.netPay < 0 && "text-destructive",
        )}
      >
        {formatCurrencyExact(row.netPay)}
      </TableCell>
    </TableRow>
  );
}

/** Working days drive the day rate, so they're set per month, not guessed. */
function WorkingDaysField({
  month,
  workingDays,
}: {
  month: string;
  workingDays: number;
}) {
  const save = useSavePayrollMonth(month);
  const [value, setValue] = useState(String(workingDays));

  useEffect(() => setValue(String(workingDays)), [workingDays, month]);

  const commit = async () => {
    const next = Number(value);
    if (!Number.isInteger(next) || next < 1 || next > 31) {
      toast.error("Working days must be between 1 and 31");
      setValue(String(workingDays));
      return;
    }
    if (next === workingDays) return;
    try {
      await save.mutateAsync(next);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
      setValue(String(workingDays));
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="working-days" className="text-sm text-muted-foreground">
        Working days
      </Label>
      <Input
        id="working-days"
        type="number"
        min={1}
        max={31}
        value={value}
        disabled={save.isPending}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        className="h-9 w-20 text-center tabular-nums"
      />
    </div>
  );
}
