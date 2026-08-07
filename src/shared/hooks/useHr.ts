import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/shared/lib/queryClient";
import {
  clearAttendance,
  createEmployee,
  deleteEmployee,
  fetchAttendance,
  fetchAttendanceRange,
  fetchEmployee,
  fetchEmployees,
  markAllAttendance,
  markAttendance,
  fetchAdvances,
  fetchPayrollMonth,
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

export function useAttendance(date: string) {
  return useQuery({
    queryKey: qk.attendanceDay(date),
    queryFn: () => fetchAttendance(date),
  });
}

function useInvalidateAttendance(date: string) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: qk.attendanceDay(date) });
    // The payroll view and month sheets sum the month, so they go stale too.
    qc.invalidateQueries({ queryKey: ["attendance-month", date.slice(0, 7)] });
  };
}

export function useMarkAttendance(date: string) {
  const invalidate = useInvalidateAttendance(date);
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

export function useSetHoursWorked(date: string) {
  const invalidate = useInvalidateAttendance(date);
  return useMutation({
    mutationFn: (args: { employeeId: string; hours: number }) =>
      setHoursWorked({ ...args, date }),
    onSuccess: invalidate,
  });
}

export function useClearAttendance(date: string) {
  const invalidate = useInvalidateAttendance(date);
  return useMutation({
    mutationFn: (employeeId: string) => clearAttendance({ employeeId, date }),
    onSuccess: invalidate,
  });
}

export function useMarkAllAttendance(date: string) {
  const invalidate = useInvalidateAttendance(date);
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

/** Marks one day for one worker from their month sheet. */
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
    onSuccess: (_data, args) => invalidateMonth(qc, month, args.date),
  });
}

export function useClearAttendanceForMonth(month: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { employeeId: string; date: string }) =>
      clearAttendance(args),
    onSuccess: (_data, args) => invalidateMonth(qc, month, args.date),
  });
}

export function useSetHoursForMonth(month: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { employeeId: string; date: string; hours: number }) =>
      setHoursWorked(args),
    onSuccess: (_data, args) => invalidateMonth(qc, month, args.date),
  });
}

export function useSetOvertimeForMonth(month: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { employeeId: string; date: string; hours: number }) =>
      setOvertime(args),
    onSuccess: (_data, args) => invalidateMonth(qc, month, args.date),
  });
}

/** A month-sheet edit touches that day's view and both month views. */
function invalidateMonth(
  qc: ReturnType<typeof useQueryClient>,
  month: string,
  date: string,
) {
  qc.invalidateQueries({ queryKey: ["attendance-month", month] });
  qc.invalidateQueries({ queryKey: qk.attendanceDay(date) });
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
    mutationFn: (args: { employeeId: string; amount: number }) =>
      saveAdvance({ ...args, month: `${month}-01` }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.advances(month) }),
  });
}

export function useSetOvertime(date: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { employeeId: string; hours: number }) =>
      setOvertime({ ...args, date }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.attendanceDay(date) });
      qc.invalidateQueries({ queryKey: ["attendance-month", date.slice(0, 7)] });
    },
  });
}

/** "2026-08" -> "2026-08-31" */
function monthEnd(month: string): string {
  const year = Number(month.slice(0, 4));
  const m = Number(month.slice(5, 7));
  return `${month}-${String(new Date(year, m, 0).getDate()).padStart(2, "0")}`;
}
