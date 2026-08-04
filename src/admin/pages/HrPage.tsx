import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { CircleSlash, Pencil, Plus, Trash2, UserRound } from "lucide-react";
import {
  useAttendance,
  useClearAttendance,
  useDeleteEmployee,
  useEmployees,
  useMarkAllAttendance,
  useMarkAttendance,
} from "@/shared/hooks/useHr";
import { Button } from "@/shared/components/ui/button";
import { DatePicker } from "@/shared/components/ui/date-picker";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/shared/components/ui/table";
import { LoadingState, ErrorState, EmptyState, Spinner } from "@/shared/components/StateViews";
import { dateKey, formatCurrency } from "@/shared/utils/format";
import { cn } from "@/shared/utils/cn";
import type { AttendanceStatus, Employee } from "@/shared/types/models";

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
        </TabsList>

        <TabsContent value="workers">
          <WorkersTab />
        </TabsContent>
        <TabsContent value="attendance">
          <AttendanceTab />
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

/* ------------------------------- Workers -------------------------------- */

function WorkersTab() {
  const { data: employees, isLoading, isError, error, refetch } = useEmployees();
  const roster = employees ?? [];
  const payroll = roster.reduce((sum, e) => sum + Number(e.salary), 0);

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
            {roster.map((employee) => (
              <WorkerRow key={employee.id} employee={employee} />
            ))}
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

  const statusById = useMemo(() => {
    const map = new Map<string, AttendanceStatus>();
    for (const record of records ?? []) map.set(record.employee_id, record.status);
    return map;
  }, [records]);

  const roster = employees ?? [];
  const present = roster.filter((e) => statusById.get(e.id) === "present").length;
  const absent = roster.filter((e) => statusById.get(e.id) === "absent").length;
  const unmarked = roster.length - present - absent;

  const handleMarkAll = async (status: AttendanceStatus) => {
    try {
      await markAll.mutateAsync({ employeeIds: roster.map((e) => e.id), status });
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
            disabled={markAll.isPending || roster.length === 0}
          >
            {markAll.isPending ? <Spinner className="h-4 w-4" /> : "P"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="w-10 font-semibold text-rose-700 hover:bg-rose-50"
            title="Mark everyone absent"
            onClick={() => handleMarkAll("absent")}
            disabled={markAll.isPending || roster.length === 0}
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

          <div className="overflow-hidden rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>Worker</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead className="w-[1%] text-right">P / A</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roster.map((employee) => (
                  <AttendanceRow
                    key={employee.id}
                    employee={employee}
                    date={date}
                    status={statusById.get(employee.id)}
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
  status,
}: {
  employee: Employee;
  date: string;
  status?: AttendanceStatus;
}) {
  const mark = useMarkAttendance(date);
  const clear = useClearAttendance(date);
  const busy = mark.isPending || clear.isPending;

  /** Tapping the letter that is already lit clears the mark instead. */
  const toggle = async (next: AttendanceStatus) => {
    try {
      if (status === next) await clear.mutateAsync(employee.id);
      else await mark.mutateAsync({ employeeId: employee.id, status: next });
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
      <TableCell>
        <div className="flex items-center justify-end gap-2">
          {!status && (
            <CircleSlash className="hidden h-4 w-4 text-muted-foreground sm:block" />
          )}
          <div className="inline-flex overflow-hidden rounded-lg border">
            <MarkButton
              letter="P"
              title={`Mark ${employee.name} present`}
              active={status === "present"}
              tone="present"
              disabled={busy}
              onClick={() => toggle("present")}
            />
            <MarkButton
              letter="A"
              title={`Mark ${employee.name} absent`}
              active={status === "absent"}
              tone="absent"
              disabled={busy}
              onClick={() => toggle("absent")}
            />
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}

function MarkButton({
  letter,
  title,
  active,
  tone,
  disabled,
  onClick,
}: {
  letter: string;
  title: string;
  active: boolean;
  tone: "present" | "absent";
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "h-9 w-10 text-sm font-bold transition-colors first:border-r disabled:opacity-50",
        !active && "bg-background text-muted-foreground",
        !active && tone === "present" && "hover:bg-emerald-50 hover:text-emerald-700",
        !active && tone === "absent" && "hover:bg-rose-50 hover:text-rose-700",
        active && tone === "present" && "bg-emerald-600 text-white",
        active && tone === "absent" && "bg-rose-600 text-white",
      )}
    >
      {letter}
    </button>
  );
}
