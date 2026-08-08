import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowDownAZ, ChevronRight, CircleSlash, Hash, Plus, Search, UserRound,
} from "lucide-react";
import {
  useAdvances,
  useAttendanceDay,
  useAttendanceMonth,
  useClearAttendanceForDay,
  useEmployees,
  useMarkAllAttendance,
  useMarkAttendanceForDay,
  usePayrollMonth,
  useSavePayrollMonth,
  useSetHoursForDay,
  useSetOvertimeForDay,
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
import { dateKey, formatCurrency, formatCurrencyExact, formatMonth } from "@/shared/utils/format";
import { cn } from "@/shared/utils/cn";
import {
  calcPayroll,
  DEFAULT_WORKING_DAYS,
  type AttendanceRecord,
  type AttendanceStatus,
  type Employee,
  type PayrollRow,
} from "@/shared/types/models";

/**
 * Three views over the roster: the workers themselves, one day's attendance
 * across everyone, and the month's payroll across everyone. Editing a single
 * worker's month happens on their own page.
 */
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

function SearchField({
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

function matches(employee: Employee, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    employee.name.toLowerCase().includes(q) ||
    employee.employee_code.toLowerCase().includes(q) ||
    employee.designation.toLowerCase().includes(q)
  );
}

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

function NoMatch({ query, colSpan }: { query: string; colSpan: number }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="py-8 text-center text-muted-foreground">
        No worker matches “{query}”.
      </TableCell>
    </TableRow>
  );
}

/**
 * Every worker's month, tallied from attendance and advances. Shared by the
 * Workers and Payroll tabs.
 */
function usePayrollRows(month: string) {
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

  return { rows, roster, workingDays, isLoading, isError, error, refetch };
}

/* ------------------------------- Workers -------------------------------- */

type WorkerSortKey = "id" | "name";

/** Employee codes are zero-padded (EMP-0001…), so plain string order is numeric order too. */
function sortWorkerRows(rows: PayrollRow[], sortBy: WorkerSortKey): PayrollRow[] {
  return [...rows].sort((a, b) =>
    sortBy === "id"
      ? a.employee.employee_code.localeCompare(b.employee.employee_code)
      : a.employee.name.localeCompare(b.employee.name),
  );
}

function WorkerSortToggle({
  value,
  onChange,
}: {
  value: WorkerSortKey;
  onChange: (next: WorkerSortKey) => void;
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-lg border">
      <SortButton
        label="ID"
        icon={<Hash className="h-3.5 w-3.5" />}
        title="Sort by worker ID"
        active={value === "id"}
        onClick={() => onChange("id")}
      />
      <SortButton
        label="A–Z"
        icon={<ArrowDownAZ className="h-3.5 w-3.5" />}
        title="Sort alphabetically by name"
        active={value === "name"}
        onClick={() => onChange("name")}
      />
    </div>
  );
}

function SortButton({
  label,
  icon,
  title,
  active,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  title: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex h-9 items-center gap-1.5 px-3 text-sm font-medium transition-colors first:border-r",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function WorkersTab() {
  const month = dateKey().slice(0, 7);
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<WorkerSortKey>("name");
  const { rows, roster, workingDays, isLoading, isError, error, refetch } =
    usePayrollRows(month);

  const shown = sortWorkerRows(rows, sortBy).filter((row) => matches(row.employee, query));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchField value={query} onChange={setQuery} />
        <WorkerSortToggle value={sortBy} onChange={setSortBy} />
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
                <TableRow
                  key={row.employee.id}
                  onClick={() => navigate(`/admin/hr/${row.employee.id}`)}
                  className="group cursor-pointer"
                  title={`Open ${row.employee.name}`}
                >
                  <TableCell>
                    <EmployeeCell employee={row.employee} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.employee.designation}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(row.employee.salary)}
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
              ))}
              {shown.length === 0 && <NoMatch query={query} colSpan={7} />}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Attendance ------------------------------ */

/** One day across the whole roster — the daily marking round. */
function AttendanceTab() {
  const [date, setDate] = useState(dateKey());
  const [query, setQuery] = useState("");
  const { data: employees, isLoading, isError, error, refetch } = useEmployees();
  const { data: records } = useAttendanceDay(date);
  const markAll = useMarkAllAttendance(date);

  const recordById = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    for (const record of records ?? []) map.set(record.employee_id, record);
    return map;
  }, [records]);

  const all = employees ?? [];
  const shown = all.filter((e) => matches(e, query));
  const statusOf = (id: string) => recordById.get(id)?.status;
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

          <SearchField value={query} onChange={setQuery} />

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
                {shown.map((employee) => (
                  <AttendanceRow
                    key={employee.id}
                    employee={employee}
                    date={date}
                    record={recordById.get(employee.id)}
                  />
                ))}
                {shown.length === 0 && <NoMatch query={query} colSpan={5} />}
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
  const mark = useMarkAttendanceForDay(date);
  const clear = useClearAttendanceForDay(date);
  const setHours = useSetHoursForDay(date);
  const setOvertime = useSetOvertimeForDay(date);
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

/** The month's pay for everyone at once. Advances are edited per worker. */
function PayrollTab() {
  const [month, setMonth] = useState(dateKey().slice(0, 7));
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { rows, roster, workingDays, isLoading, isError, error, refetch } =
    usePayrollRows(month);

  const shown = rows.filter((row) => matches(row.employee, query));
  const total = (pick: (row: PayrollRow) => number) =>
    rows.reduce((sum, row) => sum + pick(row), 0);

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
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Tile label="Hours worked" value={total((r) => r.hoursWorked)} />
            <Tile label="Overtime hours" value={total((r) => r.overtimeHours)} />
            <Tile label="Advances" value={formatCurrency(total((r) => r.advance))} />
            <Tile label="Net payable" value={formatCurrency(total((r) => r.netPay))} />
          </div>

          <SearchField value={query} onChange={setQuery} />

          <div className="overflow-hidden rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>Worker</TableHead>
                  <TableHead className="text-right">Present</TableHead>
                  <TableHead className="text-right">Hours</TableHead>
                  <TableHead className="text-right">OT hrs</TableHead>
                  <TableHead className="text-right">Earned</TableHead>
                  <TableHead className="text-right">Cash adv.</TableHead>
                  <TableHead className="text-right">Bank adv.</TableHead>
                  <TableHead className="text-right">Net payable</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shown.map((row) => (
                  <TableRow
                    key={row.employee.id}
                    onClick={() => navigate(`/admin/hr/${row.employee.id}`)}
                    className="cursor-pointer"
                    title={`Open ${row.employee.name}`}
                  >
                    <TableCell>
                      <EmployeeCell employee={row.employee} />
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
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {row.cashAdvance ? formatCurrency(row.cashAdvance) : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {row.bankAdvance ? formatCurrency(row.bankAdvance) : "—"}
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
                ))}
                {shown.length === 0 && <NoMatch query={query} colSpan={8} />}

                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableCell colSpan={4} className="font-medium">
                    Total
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatCurrencyExact(total((r) => r.totalPay))}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatCurrency(total((r) => r.cashAdvance))}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatCurrency(total((r) => r.bankAdvance))}
                  </TableCell>
                  <TableCell className="text-right font-bold tabular-nums">
                    {formatCurrencyExact(total((r) => r.netPay))}
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

/** Working days drive the day rate, so they're set per month, not guessed. */
function WorkingDaysField({
  month,
  workingDays,
}: {
  month: string;
  workingDays: number;
}) {
  const save = useSavePayrollMonth(month);

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="working-days" className="text-sm text-muted-foreground">
        Working days
      </Label>
      <InlineNumberInput
        value={workingDays}
        min={1}
        max={31}
        step="1"
        className="mx-0 w-20"
        invalidMessage="Working days must be between 1 and 31"
        onCommit={(days) => save.mutateAsync(days).then(() => {})}
      />
    </div>
  );
}
