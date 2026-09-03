import { calcPayroll, payrollDrift, payrollSnapshot } from "@/shared/types/models";
import type { SalaryPayment } from "@/shared/types/models";

const employee = { id: "e1", salary: 13000, shift_hours: 12 } as never;
const row = calcPayroll({
  employee, workingDays: 26, presentDays: 12, absentDays: 0,
  hoursWorked: 144, overtimeHours: 12, cashAdvance: 1000, bankAdvance: 0,
});

const snap = payrollSnapshot(row);
const paymentFrom = (over: Partial<SalaryPayment>): SalaryPayment =>
  ({
    id: "p", employee_id: "e1", month: "2026-07-01", paid_on: "2026-08-12",
    created_at: "", updated_at: null, amount: row.netPay,
    hours_worked: snap.hoursWorked, overtime_hours: snap.overtimeHours,
    cash_advance: snap.cashAdvance, bank_advance: snap.bankAdvance,
    salary: snap.salary, shift_hours: snap.shiftHours, working_days: snap.workingDays,
    ...over,
  }) as SalaryPayment;

const checks: [string, boolean][] = [];

// 1. Nothing edited -> no drift.
checks.push(["unchanged => no drift", payrollDrift(row, paymentFrom({})).length === 0]);

// 2. A pre-0021 row (inputs never captured) -> no false accusation.
const legacy = paymentFrom({
  hours_worked: null, overtime_hours: null, cash_advance: null,
  bank_advance: null, salary: null, shift_hours: null, working_days: null,
});
checks.push(["legacy row => no drift", payrollDrift(row, legacy).length === 0]);

// 3. The July ambiguity: overtime added after payday vs advance reduced after
//    payday moved the total identically. They must now be distinguishable.
const otAdded = payrollDrift(row, paymentFrom({ overtime_hours: 0 }));
const advCut = payrollDrift(row, paymentFrom({ cash_advance: 2000 }));
checks.push(["overtime edit named", otAdded.length === 1 && otAdded[0].label === "Overtime"]);
checks.push(["advance edit named", advCut.length === 1 && advCut[0].label === "Cash advance"]);
checks.push(["the two are distinguishable", otAdded[0].label !== advCut[0].label]);

// 4. A salary change after payday (the Raj Kumar / Rajkumar case).
const salaryChanged = payrollDrift(row, paymentFrom({ salary: 20000 }));
checks.push([
  "salary edit named with both values",
  salaryChanged.length === 1 && salaryChanged[0].paid === 20000 && salaryChanged[0].now === 13000,
]);

// 5. Several inputs moving at once are all reported.
const many = payrollDrift(row, paymentFrom({ hours_worked: 100, working_days: 25 }));
checks.push(["multiple edits all listed", many.length === 2]);

// 6. Floating point must not invent drift (0.1+0.2 style noise).
const noisy = payrollDrift(row, paymentFrom({ hours_worked: 144.0000001 }));
checks.push(["float noise ignored", noisy.length === 0]);

// 7. workingDays reaches the snapshot (it drives the day rate).
checks.push(["snapshot carries working days", snap.workingDays === 26]);

let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  if (!ok) failed++;
}
process.exit(failed === 0 ? 0 : 1);
