import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/shared/lib/queryClient";
import {
  clearAttendance,
  createEmployee,
  deleteEmployee,
  fetchAdvances,
  fetchAttendance,
  fetchAttendanceRange,
  fetchEmployee,
  fetchEmployees,
  fetchPayrollMonth,
  markAllAttendance,
  markAttendance,
  saveAdvance,
  savePayrollMonth,
  setHoursWorked,
  setOvertime,
  updateEmployee,
} from "@/shared/api/hr";
import type { AttendanceStatus, Employee } from "@/shared/types/models";
import type { TablesInsert, TablesUpdate } from "@/shared/types/database";

export function useEmployees() {
  return useQuery({ queryKey: qk.employees, queryFn: fetchEmployees });
}

/** One worker, for the editor route. */
export function useEmployee(id?: string) {
  return useQuery({
    queryKey: qk.employee(id ?? ""),
    queryFn: () => fetchEmployee(id!),
    enabled: Boolean(id),
  });
}

function useInvalidateEmployees() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: qk.employees });
}

export function useCreateEmployee() {
  const invalidate = useInvalidateEmployees();
  return useMutation({
    mutationFn: (input: Omit<TablesInsert<"employees">, "employee_code">) =>
      createEmployee(input),
    onSuccess: invalidate,
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; input: TablesUpdate<"employees"> }) =>
      updateEmployee(args.id, args.input),
    onSuccess: (_data, args) => {
      qc.invalidateQueries({ queryKey: qk.employees });
      qc.invalidateQueries({ queryKey: qk.employee(args.id) });
    },
  });
}

export function useDeleteEmployee() {
  const invalidate = useInvalidateEmployees();
  return useMutation({
    mutationFn: (id: string) => deleteEmployee(id),
    onSuccess: invalidate,
  });
}

/* ---------------------------- One day at a time -------------------------- */

export function useAttendanceDay(date: string) {
  return useQuery({
    queryKey: qk.attendanceDay(date),
    queryFn: () => fetchAttendance(date),
  });
}

/** A day's edit also invalidates that month — payroll and sheets sum it. */
function useInvalidateDay(date: string) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: qk.attendanceDay(date) });
    qc.invalidateQueries({ queryKey: ["attendance-month", date.slice(0, 7)] });
  };
}

export function useMarkAttendanceForDay(date: string) {
  const invalidate = useInvalidateDay(date);
  return useMutation({
    mutationFn: (args: {
      employeeId: string;
      status: AttendanceStatus;
      shiftHours: number;
      hours?: number;
    }) => markAttendance({ ...args, date }),
    onSuccess: invalidate,
  });
}

export function useClearAttendanceForDay(date: string) {
  const invalidate = useInvalidateDay(date);
  return useMutation({
    mutationFn: (employeeId: string) => clearAttendance({ employeeId, date }),
    onSuccess: invalidate,
  });
}

export function useSetHoursForDay(date: string) {
  const invalidate = useInvalidateDay(date);
  return useMutation({
    mutationFn: (args: { employeeId: string; hours: number }) =>
      setHoursWorked({ ...args, date }),
    onSuccess: invalidate,
  });
}

export function useSetOvertimeForDay(date: string) {
  const invalidate = useInvalidateDay(date);
  return useMutation({
    mutationFn: (args: { employeeId: string; hours: number }) =>
      setOvertime({ ...args, date }),
    onSuccess: invalidate,
  });
}

/** The "everyone present" (or absent) shortcut for a day. */
export function useMarkAllAttendance(date: string) {
  const invalidate = useInvalidateDay(date);
  return useMutation({
    mutationFn: (args: {
      employees: Pick<Employee, "id" | "shift_hours">[];
      status: AttendanceStatus;
    }) => markAllAttendance({ ...args, date }),
    onSuccess: invalidate,
  });
}

/* -------------------------------- Payroll ------------------------------- */

/**
 * Attendance for a whole month — the whole roster, or one worker when an
 * employee id is given (their month sheet).
 */
export function useAttendanceMonth(month: string, employeeId?: string) {
  return useQuery({
    queryKey: qk.attendanceMonth(month, employeeId),
    queryFn: () => fetchAttendanceRange(`${month}-01`, monthEnd(month), employeeId),
  });
}

/** Marks one day for one worker on their month sheet. */
export function useMarkAttendanceForMonth(month: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      employeeId: string;
      date: string;
      status: AttendanceStatus;
      shiftHours: number;
      hours?: number;
    }) => markAttendance(args),
    onSuccess: () => invalidateMonth(qc, month),
  });
}

export function useClearAttendanceForMonth(month: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { employeeId: string; date: string }) =>
      clearAttendance(args),
    onSuccess: () => invalidateMonth(qc, month),
  });
}

export function useSetHoursForMonth(month: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { employeeId: string; date: string; hours: number }) =>
      setHoursWorked(args),
    onSuccess: () => invalidateMonth(qc, month),
  });
}

export function useSetOvertimeForMonth(month: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { employeeId: string; date: string; hours: number }) =>
      setOvertime(args),
    onSuccess: () => invalidateMonth(qc, month),
  });
}

/** Every month-sheet edit re-reads that month, roster-wide and per worker. */
function invalidateMonth(qc: ReturnType<typeof useQueryClient>, month: string) {
  qc.invalidateQueries({ queryKey: ["attendance-month", month] });
}

export function usePayrollMonth(month: string) {
  return useQuery({
    queryKey: qk.payrollMonth(month),
    queryFn: () => fetchPayrollMonth(`${month}-01`),
  });
}

export function useSavePayrollMonth(month: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (workingDays: number) =>
      savePayrollMonth(`${month}-01`, workingDays),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.payrollMonth(month) }),
  });
}

export function useAdvances(month: string) {
  return useQuery({
    queryKey: qk.advances(month),
    queryFn: () => fetchAdvances(`${month}-01`),
  });
}

export function useSaveAdvance(month: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      employeeId: string;
      cashAdvance: number;
      bankAdvance: number;
    }) => saveAdvance({ ...args, month: `${month}-01` }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.advances(month) }),
  });
}

/** "2026-08" -> "2026-08-31" */
function monthEnd(month: string): string {
  const year = Number(month.slice(0, 4));
  const m = Number(month.slice(5, 7));
  return `${month}-${String(new Date(year, m, 0).getDate()).padStart(2, "0")}`;
}
