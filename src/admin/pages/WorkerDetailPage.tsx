import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Banknote, Pencil, Wallet } from "lucide-react";
import {
  useAdvances,
  useAttendanceMonth,
  useClearAttendance,
  useEmployee,
  useMarkAttendance,
  usePayrollMonth,
  useSaveAdvance,
  useSavePayrollMonth,
  useSetHoursWorked,
  useSetOvertime,
} from "@/shared/hooks/useHr";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { MonthPicker } from "@/shared/components/ui/month-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/shared/components/ui/table";
import { LoadingState, ErrorState } from "@/shared/components/StateViews";
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
} from "@/shared/types/models";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Everything about one worker — `/admin/hr/:id`. Their details, then a month
 * to pick, and that month's attendance, overtime, advances and pay, all
 * editable here rather than on the roster.
 */
export function WorkerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [month, setMonth] = useState(dateKey().slice(0, 7));

  const { data: employee, isLoading, isError, error, refetch } = useEmployee(id);
  const { data: records } = useAttendanceMonth(month, id);
  const { data: advances } = useAdvances(month);
  const { data: payrollMonth } = usePayrollMonth(month);

  const workingDays = payrollMonth?.working_days ?? DEFAULT_WORKING_DAYS;
  const advanceRow = (advances ?? []).find((a) => a.employee_id === id);
  const cashAdvance = Number(advanceRow?.cash_advance ?? 0);
  const bankAdvance = Number(advanceRow?.bank_advance ?? 0);

  const byDate = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    for (const record of records ?? []) map.set(record.work_date, record);
    return map;
  }, [records]);

  const days = useMemo(() => monthDays(month), [month]);
  const marked = (records ?? []).filter((r) => r.work_date.startsWith(month));
  const presentDays = marked.filter((r) => r.status === "present").length;
  const absentDays = marked.filter((r) => r.status === "absent").length;
  const hoursWorked = marked.reduce((sum, r) => sum + Number(r.hours_worked), 0);
  const overtimeHours = marked.reduce((sum, r) => sum + Number(r.overtime_hours), 0);

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState error={error} onRetry={refetch} />;
  if (!employee) return null;

  const pay = calcPayroll({
    employee,
    workingDays,
    presentDays,
    absentDays,
    hoursWorked,
    overtimeHours,
    cashAdvance,
    bankAdvance,
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        to="/admin/hr"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-accent"
      >
        <ArrowLeft className="h-4 w-4" /> Back to workers
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-bold text-primary">
            {employee.name}
          </h1>
          <p className="font-mono text-xs text-muted-foreground">
            {employee.employee_code}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to={`/admin/hr/${employee.id}/edit`}>
            <Pencil className="h-4 w-4" /> Edit details
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="grid gap-x-6 gap-y-4 p-6 sm:grid-cols-4">
          <Detail label="Designation" value={employee.designation} />
          <Detail label="Monthly salary" value={formatCurrency(employee.salary)} />
          <Detail label="Shift" value={`${employee.shift_hours} hrs/day`} />
          <Detail
            label="Hourly rate"
            value={`${formatCurrencyExact(pay.hourlyRate)}/hr`}
            hint={`Day rate ${formatCurrencyExact(pay.dayRate)} over ${workingDays} working days`}
          />
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <MonthPicker value={month} onChange={setMonth} />
        <WorkingDaysField month={month} workingDays={workingDays} />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="Present" value={`${presentDays}/${workingDays}`} tone="present" />
        <Tile label="Absent" value={absentDays} tone="absent" />
        <Tile label="Hours" value={hoursWorked} />
        <Tile label="Overtime" value={`${overtimeHours} hrs`} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Pay for this month</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-6">
            <AdvanceField
              icon={<Wallet className="h-4 w-4" />}
              label="Cash advance"
              value={cashAdvance}
              month={month}
              employeeId={employee.id}
              other={bankAdvance}
              field="cash"
            />
            <AdvanceField
              icon={<Banknote className="h-4 w-4" />}
              label="Bank advance"
              value={bankAdvance}
              month={month}
              employeeId={employee.id}
              other={cashAdvance}
              field="bank"
            />
          </div>

          <dl className="space-y-1.5 border-t pt-4 text-sm">
            <Line label="Earned" value={formatCurrencyExact(pay.basePay)} />
            <Line
              label={`Overtime (${overtimeHours} hrs)`}
              value={formatCurrencyExact(pay.overtimePay)}
            />
            <Line
              label="Advances drawn"
              value={`− ${formatCurrencyExact(pay.advance)}`}
              muted
            />
            <div className="flex items-center justify-between border-t pt-2 text-base font-bold">
              <dt>Net payable</dt>
              <dd className={cn("tabular-nums", pay.netPay < 0 && "text-destructive")}>
                {formatCurrencyExact(pay.netPay)}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

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

function Detail({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div title={hint}>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-medium">{value}</p>
    </div>
  );
}

function Line({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("tabular-nums", muted && "text-muted-foreground")}>{value}</dd>
    </div>
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

/** Cash and bank are stored on one row, so each field writes both values. */
function AdvanceField({
  icon,
  label,
  value,
  other,
  field,
  month,
  employeeId,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  other: number;
  field: "cash" | "bank";
  month: string;
  employeeId: string;
}) {
  const save = useSaveAdvance(month);

  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {icon} {label} (₹)
      </Label>
      <InlineNumberInput
        value={value}
        min={0}
        max={10_000_000}
        step="100"
        className="mx-0 w-32 text-right"
        placeholder="0"
        invalidMessage="Enter a valid advance amount"
        onCommit={(amount) =>
          save
            .mutateAsync({
              employeeId,
              cashAdvance: field === "cash" ? amount : other,
              bankAdvance: field === "bank" ? amount : other,
            })
            .then(() => {})
        }
      />
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
  const mark = useMarkAttendance(month);
  const clear = useClearAttendance(month);
  const setHours = useSetHoursWorked(month);
  const setOvertime = useSetOvertime(month);
  const status = record?.status;
  const busy = mark.isPending || clear.isPending;

  const day = new Date(`${date}T00:00:00`);
  const isSunday = day.getDay() === 0;

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
        !status && isSunday && "bg-muted/20",
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
