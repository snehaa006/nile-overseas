import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  BadgeIndianRupee,
  Check,
  CircleSlash,
  Pencil,
  Plus,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";
import {
  useAttendance,
  useClearAttendance,
  useCreateEmployee,
  useDeleteEmployee,
  useEmployees,
  useMarkAllAttendance,
  useMarkAttendance,
  useUpdateEmployee,
} from "@/shared/hooks/useHr";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
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
      <div>
        <h1 className="font-serif text-3xl font-bold text-primary">HR</h1>
        <p className="text-muted-foreground">
          Your workforce roster and daily attendance. Employee IDs are issued
          automatically when a worker is added.
        </p>
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

function Avatar({ name }: { name: string }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
      {initials(name) || <UserRound className="h-4 w-4" />}
    </div>
  );
}

function EmployeeCell({ employee }: { employee: Employee }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar name={employee.name} />
      <div className="min-w-0">
        <p className="truncate font-medium">{employee.name}</p>
        <p className="font-mono text-xs text-muted-foreground">
          {employee.employee_code}
        </p>
      </div>
    </div>
  );
}

/** A compact figure tile — the counts that sit above each tab's table. */
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

  return (
    <div className="space-y-6">
      <AddWorkerForm />

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : roster.length > 0 ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-4 rounded-xl border bg-card px-4 py-3">
              <div className="rounded-lg bg-accent/10 p-2.5 text-accent">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Workers
                </p>
                <p className="text-2xl font-bold text-primary">{roster.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-xl border bg-card px-4 py-3">
              <div className="rounded-lg bg-accent/10 p-2.5 text-accent">
                <BadgeIndianRupee className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Monthly payroll
                </p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(payroll)}
                </p>
              </div>
            </div>
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
        </>
      ) : (
        <EmptyState
          title="No workers yet"
          description="Add your first worker using the form above."
        />
      )}
    </div>
  );
}

function AddWorkerForm() {
  const create = useCreateEmployee();
  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");
  const [salary, setSalary] = useState("");

  const handleAdd = async () => {
    if (!name.trim() || !designation.trim()) {
      toast.error("Name and designation are required");
      return;
    }
    const amount = Number(salary || 0);
    if (!Number.isFinite(amount) || amount < 0) {
      toast.error("Enter a valid salary");
      return;
    }
    try {
      const employee = await create.mutateAsync({
        name: name.trim(),
        designation: designation.trim(),
        salary: amount,
      });
      toast.success(`${employee.name} added as ${employee.employee_code}`);
      setName("");
      setDesignation("");
      setSalary("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add worker");
    }
  };

  return (
    <div className="rounded-xl border bg-card">
      <div className="border-b px-4 py-3">
        <h2 className="font-medium">Add a worker</h2>
        <p className="text-xs text-muted-foreground">
          The employee ID (EMP-0001, EMP-0002, …) is generated automatically.
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-[180px] flex-1">
          <Label htmlFor="worker-name">Name</Label>
          <Input
            id="worker-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ramesh Kumar"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
        </div>
        <div className="min-w-[180px] flex-1">
          <Label htmlFor="worker-designation">Designation</Label>
          <Input
            id="worker-designation"
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            placeholder="e.g. Loom Operator"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
        </div>
        <div className="min-w-[150px]">
          <Label htmlFor="worker-salary">Monthly salary (₹)</Label>
          <Input
            id="worker-salary"
            type="number"
            min={0}
            step="0.01"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            placeholder="0"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
        </div>
        <Button onClick={handleAdd} disabled={create.isPending}>
          {create.isPending ? (
            <Spinner className="h-4 w-4" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Add Worker
        </Button>
      </div>
    </div>
  );
}

function WorkerRow({ employee }: { employee: Employee }) {
  const update = useUpdateEmployee();
  const remove = useDeleteEmployee();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(employee.name);
  const [designation, setDesignation] = useState(employee.designation);
  const [salary, setSalary] = useState(String(employee.salary));
  const busy = update.isPending || remove.isPending;

  const save = async () => {
    if (!name.trim() || !designation.trim()) {
      toast.error("Name and designation are required");
      return;
    }
    const amount = Number(salary || 0);
    if (!Number.isFinite(amount) || amount < 0) {
      toast.error("Enter a valid salary");
      return;
    }
    try {
      await update.mutateAsync({
        id: employee.id,
        input: {
          name: name.trim(),
          designation: designation.trim(),
          salary: amount,
        },
      });
      toast.success("Worker updated");
      setEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  };

  const cancel = () => {
    setName(employee.name);
    setDesignation(employee.designation);
    setSalary(String(employee.salary));
    setEditing(false);
  };

  const handleRemove = async () => {
    if (
      !confirm(
        `Remove ${employee.name} (${employee.employee_code})? Their attendance history will be deleted too.`,
      )
    )
      return;
    try {
      await remove.mutateAsync(employee.id);
      toast.success(`${employee.name} removed`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Remove failed");
    }
  };

  if (editing) {
    return (
      <TableRow className="bg-muted/30">
        <TableCell>
          <div className="flex items-center gap-3">
            <Avatar name={name || employee.name} />
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && save()}
              className="h-9"
              autoFocus
            />
          </div>
        </TableCell>
        <TableCell>
          <Input
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            className="h-9"
          />
        </TableCell>
        <TableCell>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            className="h-9 text-right"
          />
        </TableCell>
        <TableCell>
          <div className="flex justify-end gap-1.5">
            <Button size="icon" title="Save" onClick={save} disabled={busy}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="outline" title="Cancel" onClick={cancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  }

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
          <Button
            size="icon"
            variant="ghost"
            title="Edit worker"
            onClick={() => setEditing(true)}
            disabled={busy}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            title="Remove worker"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={handleRemove}
            disabled={busy}
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
      toast.success(
        status === "present" ? "Everyone marked P" : "Everyone marked A",
      );
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
        <EmptyState
          title="No workers yet"
          description="Add workers on the Workers tab before marking attendance."
        />
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

          <p className="text-xs text-muted-foreground">
            <span className="font-semibold">P</span> = present,{" "}
            <span className="font-semibold">A</span> = absent. Tap the highlighted
            letter again to clear the mark.
          </p>
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
            <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
              <CircleSlash className="h-3.5 w-3.5" /> not marked
            </span>
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
