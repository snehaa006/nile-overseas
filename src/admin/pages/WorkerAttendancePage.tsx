import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Search } from "lucide-react";
import {
  useAttendanceMonth,
  useClearAttendanceForMonth,
  useEmployee,
  useEmployees,
  useMarkAttendanceForMonth,
  useSetHoursForMonth,
  useSetOvertimeForMonth,
} from "@/shared/hooks/useHr";
import { Input } from "@/shared/components/ui/input";
import { MonthPicker } from "@/shared/components/ui/month-picker";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/shared/components/ui/table";
import { LoadingState, ErrorState } from "@/shared/components/StateViews";
import { AttendanceToggle } from "../components/AttendanceToggle";
import { InlineNumberInput } from "../components/InlineNumberInput";
import { dateKey } from "@/shared/utils/format";
import { cn } from "@/shared/utils/cn";
import type { AttendanceRecord, AttendanceStatus, Employee } from "@/shared/types/models";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** One worker's whole month: every day, editable — `/admin/hr/:id/attendance`. */
export function WorkerAttendancePage() {
  const { id } = useParams<{ id: string }>();
  const [month, setMonth] = useState(dateKey().slice(0, 7));

  const { data: employee, isLoading, isError, error, refetch } = useEmployee(id);
  const { data: records } = useAttendanceMonth(month, id);

  const byDate = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    for (const record of records ?? []) map.set(record.work_date, record);
    return map;
  }, [records]);

  const days = useMemo(() => monthDays(month), [month]);

  const marked = days.map((d) => byDate.get(d)).filter(Boolean) as AttendanceRecord[];
  const present = marked.filter((r) => r.status === "present").length;
  const absent = marked.filter((r) => r.status === "absent").length;
  const hours = marked.reduce((sum, r) => sum + Number(r.hours_worked), 0);
  const overtime = marked.reduce((sum, r) => sum + Number(r.overtime_hours), 0);

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState error={error} onRetry={refetch} />;
  if (!employee) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        to="/admin/hr"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-accent"
      >
        <ArrowLeft className="h-4 w-4" /> Back to HR
      </Link>

      <div>
        <h1 className="font-serif text-3xl font-bold text-primary">
          {employee.name}
        </h1>
        <p className="font-mono text-xs text-muted-foreground">
          {employee.employee_code} · {employee.designation} ·{" "}
          {employee.shift_hours}h shift
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <MonthPicker value={month} onChange={setMonth} />
        <WorkerSearch currentId={employee.id} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="Present" value={present} />
        <Tile label="Absent" value={absent} />
        <Tile label="Hours" value={hours} />
        <Tile label="OT hrs" value={overtime} />
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>Date</TableHead>
              <TableHead className="w-[1%] text-center">Hours</TableHead>
              <TableHead className="w-[1%] text-center">OT hrs</TableHead>
              <TableHead className="w-[1%] text-right">P / A</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {days.map((date) => (
              <DayRow
                key={date}
                date={date}
                month={month}
                employee={employee}
                record={byDate.get(date)}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function DayRow({
  date,
  month,
  employee,
  record,
}: {
  date: string;
  month: string;
  employee: Employee;
  record?: AttendanceRecord;
}) {
  const mark = useMarkAttendanceForMonth(month);
  const clear = useClearAttendanceForMonth(month);
  const setHours = useSetHoursForMonth(month);
  const setOvertime = useSetOvertimeForMonth(month);
  const status = record?.status;
  const busy = mark.isPending || clear.isPending;

  const day = new Date(`${date}T00:00:00`);
  const isWeekend = day.getDay() === 0;

  const toggle = async (next: AttendanceStatus) => {
    try {
      if (status === next) await clear.mutateAsync({ employeeId: employee.id, date });
      else
        await mark.mutateAsync({
          employeeId: employee.id,
          date,
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
        !status && isWeekend && "bg-muted/20",
      )}
    >
      <TableCell>
        <span className="font-medium tabular-nums">{date.slice(8)}</span>
        <span className="ml-2 text-xs text-muted-foreground">
          {WEEKDAYS[day.getDay()]}
        </span>
      </TableCell>
      <TableCell className="text-center">
        <InlineNumberInput
          value={Number(record?.hours_worked ?? 0)}
          disabled={status !== "present"}
          onCommit={(hours) =>
            setHours.mutateAsync({ employeeId: employee.id, date, hours }).then(() => {})
          }
        />
      </TableCell>
      <TableCell className="text-center">
        <InlineNumberInput
          value={Number(record?.overtime_hours ?? 0)}
          disabled={status !== "present"}
          onCommit={(hours) =>
            setOvertime
              .mutateAsync({ employeeId: employee.id, date, hours })
              .then(() => {})
          }
        />
      </TableCell>
      <TableCell className="text-right">
        <AttendanceToggle
          status={status}
          onToggle={toggle}
          disabled={busy}
          label={`${employee.name} on ${date}`}
        />
      </TableCell>
    </TableRow>
  );
}

/** Type a name or employee ID to jump to that worker's sheet. */
function WorkerSearch({ currentId }: { currentId: string }) {
  const { data: employees } = useEmployees();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const matches = (employees ?? [])
    .filter((e) => e.id !== currentId)
    .filter((e) => {
      const q = query.trim().toLowerCase();
      return (
        q.length > 0 &&
        (e.name.toLowerCase().includes(q) ||
          e.employee_code.toLowerCase().includes(q) ||
          e.designation.toLowerCase().includes(q))
      );
    })
    .slice(0, 6);

  return (
    <div className="relative min-w-[220px] flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search another worker…"
        className="pl-9"
      />
      {matches.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border bg-card shadow-lg">
          {matches.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-muted"
                onClick={() => {
                  setQuery("");
                  navigate(`/admin/hr/${e.id}/attendance`);
                }}
              >
                <span className="truncate font-medium">{e.name}</span>
                <span className="shrink-0 font-mono text-xs text-muted-foreground">
                  {e.employee_code}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Tile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-2xl font-bold text-primary">{value}</p>
    </div>
  );
}

/** Every date in a month as "YYYY-MM-DD". */
function monthDays(month: string): string[] {
  const year = Number(month.slice(0, 4));
  const m = Number(month.slice(5, 7));
  const count = new Date(year, m, 0).getDate();
  return Array.from(
    { length: count },
    (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`,
  );
}
