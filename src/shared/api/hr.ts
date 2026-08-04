import { supabase } from "@/shared/lib/supabase";
import type { AttendanceRecord, AttendanceStatus, Employee } from "@/shared/types/models";
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
