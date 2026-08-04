import { supabase } from "@/shared/lib/supabase";
import type {
  AttendanceRecord,
  AttendanceStatus,
  Employee,
  PayrollMonth,
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

/** Marks (or re-marks) a worker for a day — one row per worker per date. */
export async function markAttendance(args: {
  employeeId: string;
  date: string;
  status: AttendanceStatus;
}): Promise<AttendanceRecord> {
  const { data, error } = await supabase
    .from("attendance")
    .upsert(
      {
        employee_id: args.employeeId,
        work_date: args.date,
        status: args.status,
      },
      { onConflict: "employee_id,work_date" },
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Every attendance row between two dates, for the monthly payroll view. */
export async function fetchAttendanceRange(
  from: string,
  to: string,
): Promise<AttendanceRecord[]> {
  const { data, error } = await supabase
    .from("attendance")
    .select("*")
    .gte("work_date", from)
    .lte("work_date", to);
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
  employeeIds: string[];
  date: string;
  status: AttendanceStatus;
}): Promise<void> {
  if (args.employeeIds.length === 0) return;
  const { error } = await supabase.from("attendance").upsert(
    args.employeeIds.map((employee_id) => ({
      employee_id,
      work_date: args.date,
      status: args.status,
    })),
    { onConflict: "employee_id,work_date" },
  );
  if (error) throw error;
}
