import { supabase } from "@/shared/lib/supabase";
import type {
  AttendanceRecord,
  AttendanceStatus,
  Employee,
  PayrollMonth,
  SalaryAdvance,
  SalaryPayment,
} from "@/shared/types/models";
import type { TablesInsert, TablesUpdate } from "@/shared/types/database";

/** Every worker on the roster, active ones first, then alphabetical. */
export async function fetchEmployees(): Promise<Employee[]> {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .order("is_active", { ascending: false })
    .order("name");
  if (error) throw error;
  return data;
}

export async function fetchEmployee(id: string): Promise<Employee> {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

/**
 * Adds a worker. `employee_code` is deliberately omitted — the database
 * issues the next EMP-#### id so two admins can never collide on one.
 */
export async function createEmployee(
  input: Omit<TablesInsert<"employees">, "employee_code">,
): Promise<Employee> {
  const { data, error } = await supabase
    .from("employees")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateEmployee(
  id: string,
  input: TablesUpdate<"employees">,
): Promise<Employee> {
  const { data, error } = await supabase
    .from("employees")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Removes the worker and, by cascade, their attendance history. */
export async function deleteEmployee(id: string): Promise<void> {
  const { error } = await supabase.from("employees").delete().eq("id", id);
  if (error) throw error;
}

/** Attendance rows for one day — workers with no row yet are simply unmarked. */
export async function fetchAttendance(date: string): Promise<AttendanceRecord[]> {
  const { data, error } = await supabase
    .from("attendance")
    .select("*")
    .eq("work_date", date);
  if (error) throw error;
  return data;
}

/**
 * Marks (or re-marks) a worker for a day — one row per worker per date.
 * A present day starts at the worker's full shift; an absent day at zero.
 * `hours` overrides that when a short day is being recorded directly.
 */
export async function markAttendance(args: {
  employeeId: string;
  date: string;
  status: AttendanceStatus;
  shiftHours: number;
  hours?: number;
}): Promise<AttendanceRecord> {
  const hoursWorked =
    args.status === "absent" ? 0 : (args.hours ?? Number(args.shiftHours));
  const { data, error } = await supabase
    .from("attendance")
    .upsert(
      {
        employee_id: args.employeeId,
        work_date: args.date,
        status: args.status,
        hours_worked: hoursWorked,
      },
      { onConflict: "employee_id,work_date" },
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Edits hours worked on a day the worker is already marked present. */
export async function setHoursWorked(args: {
  employeeId: string;
  date: string;
  hours: number;
}): Promise<void> {
  const { error } = await supabase
    .from("attendance")
    .update({ hours_worked: args.hours })
    .eq("employee_id", args.employeeId)
    .eq("work_date", args.date);
  if (error) throw error;
}

/**
 * Every attendance row between two dates — the whole roster for the payroll
 * view, or one worker for their month sheet.
 */
export async function fetchAttendanceRange(
  from: string,
  to: string,
  employeeId?: string,
): Promise<AttendanceRecord[]> {
  let query = supabase
    .from("attendance")
    .select("*")
    .gte("work_date", from)
    .lte("work_date", to);
  if (employeeId) query = query.eq("employee_id", employeeId);
  const { data, error } = await query.order("work_date");
  if (error) throw error;
  return data;
}

/**
 * Sets overtime for a day the worker is already marked present. Sent as an
 * update (not an upsert) so overtime can never conjure an unmarked day.
 */
export async function setOvertime(args: {
  employeeId: string;
  date: string;
  hours: number;
}): Promise<void> {
  const { error } = await supabase
    .from("attendance")
    .update({ overtime_hours: args.hours })
    .eq("employee_id", args.employeeId)
    .eq("work_date", args.date);
  if (error) throw error;
}

/** The configured working days for a month, or null if never set. */
export async function fetchPayrollMonth(month: string): Promise<PayrollMonth | null> {
  const { data, error } = await supabase
    .from("payroll_months")
    .select("*")
    .eq("month", month)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function savePayrollMonth(
  month: string,
  workingDays: number,
): Promise<PayrollMonth> {
  const { data, error } = await supabase
    .from("payroll_months")
    .upsert({ month, working_days: workingDays }, { onConflict: "month" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Advances drawn by each worker in a month. */
export async function fetchAdvances(month: string): Promise<SalaryAdvance[]> {
  const { data, error } = await supabase
    .from("salary_advances")
    .select("*")
    .eq("month", month);
  if (error) throw error;
  return data;
}

/**
 * Sets a worker's advances for a month — one running cash figure and one
 * bank figure, not a ledger of withdrawals. Both are always written, so the
 * caller passes the current value for whichever field it isn't changing.
 */
export async function saveAdvance(args: {
  employeeId: string;
  month: string;
  cashAdvance: number;
  bankAdvance: number;
}): Promise<SalaryAdvance> {
  const { data, error } = await supabase
    .from("salary_advances")
    .upsert(
      {
        employee_id: args.employeeId,
        month: args.month,
        cash_advance: args.cashAdvance,
        bank_advance: args.bankAdvance,
      },
      { onConflict: "employee_id,month" },
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Marks one worker across many days at once — the "all present" shortcut on
 * a worker's month sheet. Days already marked are overwritten, so a month can
 * be filled in one go and then corrected day by day.
 */
export async function markAttendanceForDates(args: {
  employeeId: string;
  dates: string[];
  status: AttendanceStatus;
  shiftHours: number;
}): Promise<void> {
  if (args.dates.length === 0) return;
  const { error } = await supabase.from("attendance").upsert(
    args.dates.map((date) => ({
      employee_id: args.employeeId,
      work_date: date,
      status: args.status,
      hours_worked: args.status === "absent" ? 0 : Number(args.shiftHours),
    })),
    { onConflict: "employee_id,work_date" },
  );
  if (error) throw error;
}

/* ------------------------------- Payouts -------------------------------- */

/** Salaries already handed over for a month — a row per worker paid. */
export async function fetchSalaryPayments(month: string): Promise<SalaryPayment[]> {
  const { data, error } = await supabase
    .from("salary_payments")
    .select("*")
    .eq("month", month);
  if (error) throw error;
  return data;
}

/**
 * Records a worker's salary for a month as paid. The net payable is snapshot
 * on the row, so a later attendance edit doesn't rewrite history.
 */
export async function markSalaryPaid(args: {
  employeeId: string;
  month: string;
  amount: number;
  paidOn?: string;
}): Promise<SalaryPayment> {
  const { data, error } = await supabase
    .from("salary_payments")
    .upsert(
      {
        employee_id: args.employeeId,
        month: args.month,
        amount: args.amount,
        ...(args.paidOn ? { paid_on: args.paidOn } : {}),
      },
      { onConflict: "employee_id,month" },
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Undoes a payout mark — the salary goes back to outstanding. */
export async function unmarkSalaryPaid(args: {
  employeeId: string;
  month: string;
}): Promise<void> {
  const { error } = await supabase
    .from("salary_payments")
    .delete()
    .eq("employee_id", args.employeeId)
    .eq("month", args.month);
  if (error) throw error;
}

/** Marks a batch of workers paid at once — the "everyone paid" shortcut. */
export async function markSalariesPaid(args: {
  month: string;
  payouts: { employeeId: string; amount: number }[];
  paidOn?: string;
}): Promise<void> {
  if (args.payouts.length === 0) return;
  const { error } = await supabase.from("salary_payments").upsert(
    args.payouts.map((payout) => ({
      employee_id: payout.employeeId,
      month: args.month,
      amount: payout.amount,
      ...(args.paidOn ? { paid_on: args.paidOn } : {}),
    })),
    { onConflict: "employee_id,month" },
  );
  if (error) throw error;
}

/** Clears a mark, putting the worker back to "not marked" for that day. */
export async function clearAttendance(args: {
  employeeId: string;
  date: string;
}): Promise<void> {
  const { error } = await supabase
    .from("attendance")
    .delete()
    .eq("employee_id", args.employeeId)
    .eq("work_date", args.date);
  if (error) throw error;
}

/** Marks every listed worker at once — the "all present" shortcut. */
export async function markAllAttendance(args: {
  employees: Pick<Employee, "id" | "shift_hours">[];
  date: string;
  status: AttendanceStatus;
}): Promise<void> {
  if (args.employees.length === 0) return;
  const { error } = await supabase.from("attendance").upsert(
    args.employees.map((employee) => ({
      employee_id: employee.id,
      work_date: args.date,
      status: args.status,
      hours_worked: args.status === "absent" ? 0 : Number(employee.shift_hours),
    })),
    { onConflict: "employee_id,work_date" },
  );
  if (error) throw error;
}
