import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, Pencil, Plus, Trash2, UserCheck, UserX, Undo2 } from "lucide-react";
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
import { Badge } from "@/shared/components/ui/badge";
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

/* ------------------------------- Workers -------------------------------- */

function WorkersTab() {
  const { data: employees, isLoading, isError, error, refetch } = useEmployees();

  return (
    <div className="space-y-6">
      <AddWorkerForm />

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : employees && employees.length > 0 ? (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead className="text-right">Salary</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <WorkerRow key={employee.id} employee={employee} />
              ))}
            </TableBody>
          </Table>
        </div>
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
    <div className="rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-end gap-3">
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
        <div className="min-w-[140px]">
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
      <p className="mt-2 text-xs text-muted-foreground">
        The employee ID (EMP-0001, EMP-0002, …) is generated automatically.
      </p>
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
      <TableRow>
        <TableCell className="font-mono text-xs">{employee.employee_code}</TableCell>
        <TableCell>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-8"
            autoFocus
          />
        </TableCell>
        <TableCell>
          <Input
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            className="h-8"
          />
        </TableCell>
        <TableCell>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            className="h-8 text-right"
          />
        </TableCell>
        <TableCell>
          <div className="flex justify-end gap-2">
            <Button size="sm" onClick={save} disabled={busy}>
              <Check className="h-4 w-4" /> Save
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setName(employee.name);
                setDesignation(employee.designation);
                setSalary(String(employee.salary));
                setEditing(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow>
      <TableCell className="font-mono text-xs">{employee.employee_code}</TableCell>
      <TableCell className="font-medium">{employee.name}</TableCell>
      <TableCell className="text-muted-foreground">{employee.designation}</TableCell>
      <TableCell className="text-right">{formatCurrency(employee.salary)}</TableCell>
      <TableCell>
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEditing(true)}
            disabled={busy}
          >
            <Pencil className="h-4 w-4" /> Edit
          </Button>
          <Button
            size="icon"
            variant="destructive"
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

  const handleMarkAllPresent = async () => {
    try {
      await markAll.mutateAsync({
        employeeIds: roster.map((e) => e.id),
        status: "present",
      });
      toast.success("Everyone marked present");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to mark attendance");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DatePicker value={date} onChange={setDate} />
        <Button
          variant="outline"
          onClick={handleMarkAllPresent}
          disabled={markAll.isPending || roster.length === 0}
        >
          {markAll.isPending ? (
            <Spinner className="h-4 w-4" />
          ) : (
            <UserCheck className="h-4 w-4" />
          )}
          Mark all present
        </Button>
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
          <div className="flex flex-wrap gap-3 text-sm">
            <Badge variant="success">Present: {present}</Badge>
            <Badge variant="secondary">Absent: {absent}</Badge>
            <Badge variant="muted">Not marked: {unmarked}</Badge>
          </div>

          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead className="text-right">Attendance</TableHead>
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

  const setStatus = async (next: AttendanceStatus) => {
    try {
      await mark.mutateAsync({ employeeId: employee.id, status: next });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save attendance");
    }
  };

  const handleClear = async () => {
    try {
      await clear.mutateAsync(employee.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to clear attendance");
    }
  };

  return (
    <TableRow className={cn(status === "absent" && "bg-muted/40")}>
      <TableCell className="font-mono text-xs">{employee.employee_code}</TableCell>
      <TableCell className="font-medium">{employee.name}</TableCell>
      <TableCell className="text-muted-foreground">{employee.designation}</TableCell>
      <TableCell>
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            size="sm"
            variant={status === "present" ? "default" : "outline"}
            onClick={() => setStatus("present")}
            disabled={busy}
          >
            <UserCheck className="h-4 w-4" /> Present
          </Button>
          <Button
            size="sm"
            variant={status === "absent" ? "destructive" : "outline"}
            onClick={() => setStatus("absent")}
            disabled={busy}
          >
            <UserX className="h-4 w-4" /> Absent
          </Button>
          {status && (
            <Button
              size="icon"
              variant="ghost"
              title="Clear mark"
              onClick={handleClear}
              disabled={busy}
            >
              <Undo2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
