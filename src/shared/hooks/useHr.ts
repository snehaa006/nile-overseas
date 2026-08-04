import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/shared/lib/queryClient";
import {
  clearAttendance,
  createEmployee,
  deleteEmployee,
  fetchAttendance,
  fetchEmployees,
  markAllAttendance,
  markAttendance,
  updateEmployee,
} from "@/shared/api/hr";
import type { AttendanceStatus } from "@/shared/types/models";
import type { TablesInsert, TablesUpdate } from "@/shared/types/database";

export function useEmployees() {
  return useQuery({ queryKey: qk.employees, queryFn: fetchEmployees });
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
  const invalidate = useInvalidateEmployees();
  return useMutation({
    mutationFn: (args: { id: string; input: TablesUpdate<"employees"> }) =>
      updateEmployee(args.id, args.input),
    onSuccess: invalidate,
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
  return () => qc.invalidateQueries({ queryKey: qk.attendanceDay(date) });
}

export function useMarkAttendance(date: string) {
  const invalidate = useInvalidateAttendance(date);
  return useMutation({
    mutationFn: (args: { employeeId: string; status: AttendanceStatus }) =>
      markAttendance({ ...args, date }),
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
    mutationFn: (args: { employeeIds: string[]; status: AttendanceStatus }) =>
      markAllAttendance({ ...args, date }),
    onSuccess: invalidate,
  });
}
