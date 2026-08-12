import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowDownAZ, BadgeCheck, Check, ChevronRight, CircleSlash, FileDown, Hash,
  Plus, Search, UserRound,
} from "lucide-react";
import {
  useAdvances,
  useAttendanceDay,
  useAttendanceMonth,
  useClearAttendanceForDay,
  useDepartments,
  useEmployees,
  useMarkAllAttendance,
  useMarkAllSalariesPaid,
  useMarkAttendanceForDay,
  usePayrollMonth,
  useSalaryPayments,
  useSavePayrollMonth,
  useSetHoursForDay,
  useSetOvertimeForDay,
  useSetSalaryPaid,
} from "@/shared/hooks/useHr";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { DatePicker } from "@/shared/components/ui/date-picker";
import { MonthPicker } from "@/shared/components/ui/month-picker";
import { Select } from "@/shared/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/shared/components/ui/table";
import { LoadingState, ErrorState, EmptyState, Spinner } from "@/shared/components/StateViews";
import { AttendanceToggle } from "../components/AttendanceToggle";
import { InlineNumberInput } from "../components/InlineNumberInput";
import { exportPayrollPdf } from "../components/payrollPdf";
import {
  dateKey, formatCurrency, formatCurrencyExact, formatDate, formatMonth,
} from "@/shared/utils/format";
import { cn } from "@/shared/utils/cn";
import {
  calcPayroll,
  DEFAULT_WORKING_DAYS,
  type AttendanceRecord,
  type AttendanceStatus,
  type Department,
  type Employee,
  type PayrollRow,
  type SalaryPayment,
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

function matches(employee: Employee, query: string, department?: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    employee.name.toLowerCase().includes(q) ||
    employee.employee_code.toLowerCase().includes(q) ||
    employee.designation.toLowerCase().includes(q) ||
    (department ?? "").toLowerCase().includes(q)
  );
}

/* ------------------------------ Departments ----------------------------- */

/** "all" is every worker; "none" is the ones not assigned to a department. */
type DepartmentFilterValue = string;

function inDepartment(employee: Employee, filter: DepartmentFilterValue): boolean {
  if (filter === "all") return true;
  if (filter === "none") return !employee.department_id;
  return employee.department_id === filter;
}

/**
 * The departments as a lookup, so every view can name a worker's department
 * without joining it onto the roster query.
 */
function useDepartmentNames() {
  const { data: departments } = useDepartments();
  const list = departments ?? [];
  const byId = useMemo(
    () => new Map(list.map((d) => [d.id, d.name])),
    [list],
  );
  return {
    departments: list,
    nameOf: (employee: Employee) =>
      (employee.department_id && byId.get(employee.department_id)) || "—",
  };
}

function DepartmentFilter({
  value,
  onChange,
  departments,
}: {
  value: DepartmentFilterValue;
  onChange: (next: DepartmentFilterValue) => void;
  departments: Department[];
}) {
  return (
    <Select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 w-48"
      aria-label="Filter by department"
      title="Show only one department"
    >
      <option value="all">All departments</option>
      {departments.map((department) => (
        <option key={department.id} value={department.id}>
          {department.name}
        </option>
      ))}
      <option value="none">No department</option>
    </Select>
  );
}

/** A worker's department, quiet enough to sit in a dense table. */
function DepartmentTag({ name }: { name: string }) {
  if (name === "—") return <span className="text-muted-foreground">—</span>;
  return (
    <span className="inline-flex items-center rounded-full border bg-muted/50 px-2 py-0.5 text-xs font-medium text-foreground">
      {name}
    </span>
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
        {query.trim()
          ? `No worker matches “${query}”.`
          : "No workers in this department."}
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
function compareBy(sortBy: WorkerSortKey) {
  return (a: Employee, b: Employee) =>
    sortBy === "id"
      ? a.employee_code.localeCompare(b.employee_code)
      : a.name.localeCompare(b.name);
}

function sortEmployees(employees: Employee[], sortBy: WorkerSortKey): Employee[] {
  return [...employees].sort(compareBy(sortBy));
}

function sortWorkerRows(rows: PayrollRow[], sortBy: WorkerSortKey): PayrollRow[] {
  const compare = compareBy(sortBy);
  return [...rows].sort((a, b) => compare(a.employee, b.employee));
}

/**
 * Payroll sorts by payment status as well: paid first when settling up and
 * checking what has gone out, unpaid first when working through what is
 * still owed. Within a group workers stay alphabetical.
 */
type PayrollSortKey = WorkerSortKey | "paid" | "unpaid";

function sortPayrollRows(
  rows: PayrollRow[],
  sortBy: PayrollSortKey,
  isPaid: (employeeId: string) => boolean,
): PayrollRow[] {
  if (sortBy !== "paid" && sortBy !== "unpaid") return sortWorkerRows(rows, sortBy);
  const first = sortBy === "paid";
  const rank = (row: PayrollRow) => (isPaid(row.employee.id) === first ? 0 : 1);
  return [...rows].sort(
    (a, b) => rank(a) - rank(b) || a.employee.name.localeCompare(b.employee.name),
  );
}

function PayrollSortToggle({
  value,
  onChange,
}: {
  value: PayrollSortKey;
  onChange: (next: PayrollSortKey) => void;
}) {
  const byStatus = value === "paid" || value === "unpaid";
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
      <SortButton
        label={value === "unpaid" ? "Unpaid" : "Paid"}
        icon={<BadgeCheck className="h-3.5 w-3.5" />}
        title={
          value === "paid"
            ? "Paid workers first — click again to put unpaid first"
            : value === "unpaid"
              ? "Unpaid workers first — click again to put paid first"
              : "Group by payment status, paid first"
        }
        active={byStatus}
        onClick={() => onChange(value === "paid" ? "unpaid" : "paid")}
      />
    </div>
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
        "flex h-9 items-center gap-1.5 px-3 text-sm font-medium transition-colors [&:not(:last-child)]:border-r",
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
  const [department, setDepartment] = useState<DepartmentFilterValue>("all");
  const { rows, roster, workingDays, isLoading, isError, error, refetch } =
    usePayrollRows(month);
  const { departments, nameOf } = useDepartmentNames();

  const shown = sortWorkerRows(rows, sortBy)
    .filter((row) => inDepartment(row.employee, department))
    .filter((row) => matches(row.employee, query, nameOf(row.employee)));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchField value={query} onChange={setQuery} />
        <div className="flex items-center gap-3">
          <DepartmentFilter
            value={department}
            onChange={setDepartment}
            departments={departments}
          />
          <WorkerSortToggle value={sortBy} onChange={setSortBy} />
        </div>
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
                <TableHead>Department</TableHead>
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
                  <TableCell>
                    <DepartmentTag name={nameOf(row.employee)} />
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
              {shown.length === 0 && <NoMatch query={query} colSpan={8} />}
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
  const [sortBy, setSortBy] = useState<WorkerSortKey>("name");
  const [department, setDepartment] = useState<DepartmentFilterValue>("all");
  const { data: employees, isLoading, isError, error, refetch } = useEmployees();
  const { departments, nameOf } = useDepartmentNames();
  const { data: records } = useAttendanceDay(date);
  const markAll = useMarkAllAttendance(date);

  const recordById = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    for (const record of records ?? []) map.set(record.employee_id, record);
    return map;
  }, [records]);

  const roster = employees ?? [];
  const all = roster.filter((e) => inDepartment(e, department));
  const shown = sortEmployees(all, sortBy).filter((e) =>
    matches(e, query, nameOf(e)),
  );
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
        <div className="flex flex-wrap items-center gap-3">
          <DatePicker value={date} onChange={setDate} />
          <DepartmentFilter
            value={department}
            onChange={setDepartment}
            departments={departments}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Mark all{department !== "all" && " shown"}
          </span>
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
      ) : roster.length === 0 ? (
        <EmptyState title="No workers yet" description="Add a worker first." />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Tile label="Present" value={present} tone="present" />
            <Tile label="Absent" value={absent} tone="absent" />
            <Tile label="Not marked" value={unmarked} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <SearchField value={query} onChange={setQuery} />
            <WorkerSortToggle value={sortBy} onChange={setSortBy} />
          </div>

          <div className="overflow-hidden rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>Worker</TableHead>
                  <TableHead>Department</TableHead>
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
                    department={nameOf(employee)}
                    record={recordById.get(employee.id)}
                  />
                ))}
                {shown.length === 0 && <NoMatch query={query} colSpan={6} />}
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
  department,
  record,
}: {
  employee: Employee;
  date: string;
  department: string;
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
      <TableCell>
        <DepartmentTag name={department} />
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
  const [sortBy, setSortBy] = useState<PayrollSortKey>("name");
  const [department, setDepartment] = useState<DepartmentFilterValue>("all");
  const navigate = useNavigate();
  const { rows: unsorted, roster, workingDays, isLoading, isError, error, refetch } =
    usePayrollRows(month);
  const { departments, nameOf } = useDepartmentNames();
  const { data: payments } = useSalaryPayments(month);
  const markAllPaid = useMarkAllSalariesPaid(month);

  const paidById = useMemo(() => {
    const map = new Map<string, SalaryPayment>();
    for (const payment of payments ?? []) map.set(payment.employee_id, payment);
    return map;
  }, [payments]);

  // The department is a scope, not a search: totals, the payout shortcut and
  // the exported sheet all describe exactly the workers on screen.
  const rows = useMemo(
    () =>
      sortPayrollRows(
        unsorted.filter((row) => inDepartment(row.employee, department)),
        sortBy,
        (employeeId) => paidById.has(employeeId),
      ),
    [unsorted, sortBy, department, paidById],
  );
  const departmentName =
    department === "all"
      ? null
      : department === "none"
        ? "No department"
        : (departments.find((d) => d.id === department)?.name ?? null);

  const shown = rows.filter((row) => matches(row.employee, query, nameOf(row.employee)));
  const total = (pick: (row: PayrollRow) => number) =>
    rows.reduce((sum, row) => sum + pick(row), 0);

  const unpaid = rows.filter((row) => !paidById.has(row.employee.id));
  const paidTotal = rows
    .filter((row) => paidById.has(row.employee.id))
    .reduce((sum, row) => sum + row.netPay, 0);

  /** The whole month, not just the search hits — a sheet with gaps is worse than none. */
  const handleExport = () => {
    try {
      exportPayrollPdf({
        month,
        workingDays,
        rows,
        department: departmentName,
        departmentOf: nameOf,
        paymentsByEmployee: paidById,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open the print view");
    }
  };

  const handleMarkAllPaid = async () => {
    try {
      await markAllPaid.mutateAsync(
        unpaid.map((row) => ({ employeeId: row.employee.id, amount: row.netPay })),
      );
      toast.success(
        `Marked ${unpaid.length} ${unpaid.length === 1 ? "salary" : "salaries"} paid`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to mark salaries paid");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <MonthPicker value={month} onChange={setMonth} />
        <WorkingDaysField month={month} workingDays={workingDays} />
        <DepartmentFilter
          value={department}
          onChange={setDepartment}
          departments={departments}
        />
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllPaid}
            disabled={markAllPaid.isPending || unpaid.length === 0}
            title={
              unpaid.length === 0
                ? "Everyone is already marked paid for this month"
                : `Mark ${unpaid.length} outstanding ${unpaid.length === 1 ? "salary" : "salaries"} paid`
            }
          >
            {markAllPaid.isPending ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Mark all paid
          </Button>
          <Button
            size="sm"
            onClick={handleExport}
            disabled={roster.length === 0}
            title={`Export ${formatMonth(`${month}-01`)} salaries${
              departmentName ? ` for ${departmentName}` : ""
            } as PDF`}
          >
            <FileDown className="h-4 w-4" /> Export PDF
          </Button>
        </div>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : roster.length === 0 ? (
        <EmptyState title="No workers yet" description="Add a worker first." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <Tile label="Hours worked" value={total((r) => r.hoursWorked)} />
            <Tile label="Overtime hours" value={total((r) => r.overtimeHours)} />
            <Tile label="Advances" value={formatCurrency(total((r) => r.advance))} />
            <Tile label="Net payable" value={formatCurrency(total((r) => r.netPay))} />
            <Tile label="Paid" value={formatCurrency(paidTotal)} tone="present" />
            <Tile
              label={`Outstanding · ${unpaid.length}`}
              value={formatCurrency(unpaid.reduce((sum, row) => sum + row.netPay, 0))}
              tone="absent"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <SearchField value={query} onChange={setQuery} />
            <PayrollSortToggle value={sortBy} onChange={setSortBy} />
          </div>

          <div className="overflow-hidden rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>Worker</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Present</TableHead>
                  <TableHead className="text-right">Hours</TableHead>
                  <TableHead className="text-right">OT hrs</TableHead>
                  <TableHead className="text-right">Earned</TableHead>
                  <TableHead className="text-right">Cash adv.</TableHead>
                  <TableHead className="text-right">Bank adv.</TableHead>
                  <TableHead className="text-right">Net payable</TableHead>
                  <TableHead className="text-center">Paid</TableHead>
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
                    <TableCell>
                      <DepartmentTag name={nameOf(row.employee)} />
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
                    <TableCell
                      className="text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <PaidToggle
                        month={month}
                        employeeId={row.employee.id}
                        netPay={row.netPay}
                        payment={paidById.get(row.employee.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {shown.length === 0 && <NoMatch query={query} colSpan={10} />}

                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableCell colSpan={5} className="font-medium">
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
                  <TableCell className="text-center text-xs text-muted-foreground">
                    {rows.length - unpaid.length}/{rows.length}
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
 * Whether this worker's month has been handed over. Paid shows the date it
 * was marked; clicking a paid chip puts it back to outstanding, so a
 * mis-click is one click to undo.
 */
function PaidToggle({
  month,
  employeeId,
  netPay,
  payment,
}: {
  month: string;
  employeeId: string;
  netPay: number;
  payment?: SalaryPayment;
}) {
  const setPaid = useSetSalaryPaid(month);
  const paid = Boolean(payment);

  const toggle = async () => {
    try {
      await setPaid.mutateAsync({ employeeId, amount: netPay, paid: !paid });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update payment");
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={setPaid.isPending}
      aria-pressed={paid}
      title={
        paid
          ? `Paid on ${formatDate(payment!.paid_on)} — click to mark unpaid`
          : "Mark this salary as paid"
      }
      className={cn(
        "inline-flex min-w-[6.5rem] items-center justify-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-50",
        paid
          ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
          : "border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      {setPaid.isPending ? (
        <Spinner className="h-3.5 w-3.5" />
      ) : paid ? (
        <Check className="h-3.5 w-3.5" />
      ) : null}
      {paid ? formatDate(payment!.paid_on).replace(/ \d{4}$/, "") : "Mark paid"}
    </button>
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
