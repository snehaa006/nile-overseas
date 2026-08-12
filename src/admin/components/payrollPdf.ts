import { escapeHtml, printDocument } from "@/shared/utils/pdf";
import {
  dateKey,
  formatCurrency,
  formatCurrencyExact,
  formatDate,
  formatMonth,
} from "@/shared/utils/format";
import type { PayrollRow, SalaryPayment } from "@/shared/types/models";

/** Scoped to the print root — the app's own stylesheet is still loaded. */
const STYLES = `
#print-doc-root, #print-doc-root * { box-sizing: border-box; }
#print-doc-root {
  font-family: ui-sans-serif, system-ui, "Segoe UI", Helvetica, Arial, sans-serif;
  color: #1c1917;
  font-size: 9.5px;
  line-height: 1.35;
}
#print-doc-root .sheet-head {
  display: flex; align-items: flex-start; justify-content: space-between;
  border-bottom: 2px solid #1c1917; padding-bottom: 8px; margin-bottom: 10px;
}
#print-doc-root .company { font-size: 17px; font-weight: 700; margin: 0; }
#print-doc-root .subtitle { font-size: 11px; margin: 2px 0 0; }
#print-doc-root .generated { text-align: right; font-size: 8.5px; color: #78716c; }
#print-doc-root .summary {
  display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px;
}
#print-doc-root .tile {
  flex: 1 1 0; min-width: 90px;
  border: 1px solid #d6d3d1; border-radius: 5px; padding: 5px 7px;
}
#print-doc-root .tile .label {
  font-size: 7.5px; text-transform: uppercase; letter-spacing: 0.06em; color: #57534e;
}
#print-doc-root .tile .value { font-size: 12px; font-weight: 700; margin-top: 1px; }
#print-doc-root .tile.is-paid { border-color: #6ee7b7; background: #ecfdf5; }
#print-doc-root .tile.is-paid .value { color: #065f46; }
#print-doc-root .tile.is-due { border-color: #fda4af; background: #fff1f2; }
#print-doc-root .tile.is-due .value { color: #9f1239; }
#print-doc-root table { width: 100%; border-collapse: collapse; table-layout: auto; }
#print-doc-root thead { display: table-header-group; }
#print-doc-root th, #print-doc-root td {
  border: 1px solid #d6d3d1; padding: 3px 5px; text-align: left; vertical-align: middle;
}
#print-doc-root th {
  background: #f5f5f4; font-size: 7.5px; text-transform: uppercase;
  letter-spacing: 0.04em; color: #44403c; font-weight: 700;
}
#print-doc-root tr { page-break-inside: avoid; }
#print-doc-root .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
#print-doc-root .muted { color: #78716c; }
#print-doc-root .code { font-family: ui-monospace, Menlo, monospace; font-size: 8.5px; white-space: nowrap; }
#print-doc-root .strong { font-weight: 700; }
#print-doc-root tfoot td { background: #f5f5f4; font-weight: 700; }
#print-doc-root .status { text-align: center; white-space: nowrap; }
#print-doc-root .pill {
  display: inline-block; border: 1px solid transparent; border-radius: 999px;
  padding: 0 5px; font-size: 7.5px; font-weight: 700;
}
#print-doc-root .pill.is-paid { background: #d1fae5; border-color: #6ee7b7; color: #065f46; }
#print-doc-root .pill.is-due { background: #ffe4e6; border-color: #fda4af; color: #9f1239; }
#print-doc-root .on { display: block; font-size: 7.5px; color: #78716c; }
#print-doc-root .sign { width: 80px; }
#print-doc-root .sheet-foot {
  margin-top: 12px; font-size: 8.5px; color: #57534e;
  display: flex; justify-content: space-between; gap: 12px;
}
`;

/**
 * The month's salary sheet as a printable document: every worker's days,
 * hours, earnings, advances and net payable, plus whether that pay has been
 * handed over. It is the sheet that gets signed on payday, so the paid column
 * carries the date and there is a signature column at the end.
 */
export function exportPayrollPdf(args: {
  month: string; // "2026-08"
  workingDays: number;
  rows: PayrollRow[];
  paymentsByEmployee: Map<string, SalaryPayment>;
  /** Names the department when the sheet covers only one, null for all. */
  department?: string | null;
  departmentOf?: (employee: PayrollRow["employee"]) => string;
}): void {
  const { month, workingDays, rows, paymentsByEmployee } = args;
  const departmentOf = args.departmentOf ?? (() => "—");
  const monthLabel = formatMonth(`${month}-01`);
  const scope = args.department ? ` · ${args.department}` : "";
  const total = (pick: (row: PayrollRow) => number) =>
    rows.reduce((sum, row) => sum + pick(row), 0);

  const paidRows = rows.filter((row) => paymentsByEmployee.has(row.employee.id));
  const unpaidRows = rows.filter((row) => !paymentsByEmployee.has(row.employee.id));
  const paidTotal = paidRows.reduce((sum, row) => sum + row.netPay, 0);
  const outstanding = unpaidRows.reduce((sum, row) => sum + row.netPay, 0);

  const body = rows
    .map((row, index) => {
      const payment = paymentsByEmployee.get(row.employee.id);
      return `
        <tr>
          <td class="num muted">${index + 1}</td>
          <td class="code">${escapeHtml(row.employee.employee_code)}</td>
          <td>${escapeHtml(row.employee.name)}</td>
          <td>${escapeHtml(departmentOf(row.employee))}</td>
          <td class="muted">${escapeHtml(row.employee.designation)}</td>
          <td class="num">${escapeHtml(formatCurrency(row.employee.salary))}</td>
          <td class="num">${row.presentDays}<span class="muted">/${workingDays}</span></td>
          <td class="num">${escapeHtml(fmtHours(row.hoursWorked))}</td>
          <td class="num">${escapeHtml(fmtHours(row.overtimeHours))}</td>
          <td class="num">${escapeHtml(formatCurrencyExact(row.totalPay))}</td>
          <td class="num">${row.cashAdvance ? escapeHtml(formatCurrency(row.cashAdvance)) : "—"}</td>
          <td class="num">${row.bankAdvance ? escapeHtml(formatCurrency(row.bankAdvance)) : "—"}</td>
          <td class="num strong">${escapeHtml(formatCurrencyExact(row.netPay))}</td>
          <td class="status">${
            payment
              ? `<span class="pill is-paid">Paid</span><span class="on">${escapeHtml(
                  formatDate(payment.paid_on),
                )}</span>`
              : `<span class="pill is-due">Unpaid</span>`
          }</td>
          <td class="sign"></td>
        </tr>`;
    })
    .join("");

  const html = `
  <div class="sheet-head">
    <div>
      <p class="company">Nile Overseas</p>
      <p class="subtitle">Salary sheet — ${escapeHtml(monthLabel)}${escapeHtml(scope)}</p>
    </div>
    <div class="generated">
      Generated ${escapeHtml(formatDate(dateKey()))}<br />
      Working days: ${workingDays}
    </div>
  </div>

  <div class="summary">
    <div class="tile"><div class="label">Workers</div><div class="value">${rows.length}</div></div>
    <div class="tile"><div class="label">Hours worked</div><div class="value">${escapeHtml(fmtHours(total((r) => r.hoursWorked)))}</div></div>
    <div class="tile"><div class="label">Overtime hrs</div><div class="value">${escapeHtml(fmtHours(total((r) => r.overtimeHours)))}</div></div>
    <div class="tile"><div class="label">Advances</div><div class="value">${escapeHtml(formatCurrency(total((r) => r.advance)))}</div></div>
    <div class="tile"><div class="label">Net payable</div><div class="value">${escapeHtml(formatCurrency(total((r) => r.netPay)))}</div></div>
    <div class="tile is-paid"><div class="label">Paid · ${paidRows.length}</div><div class="value">${escapeHtml(formatCurrency(paidTotal))}</div></div>
    <div class="tile is-due"><div class="label">Outstanding · ${unpaidRows.length}</div><div class="value">${escapeHtml(formatCurrency(outstanding))}</div></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>ID</th>
        <th>Worker</th>
        <th>Department</th>
        <th>Designation</th>
        <th class="num">Salary</th>
        <th class="num">Present</th>
        <th class="num">Hours</th>
        <th class="num">OT hrs</th>
        <th class="num">Earned</th>
        <th class="num">Cash adv.</th>
        <th class="num">Bank adv.</th>
        <th class="num">Net payable</th>
        <th class="status">Payment</th>
        <th>Signature</th>
      </tr>
    </thead>
    <tbody>
      ${body || `<tr><td colspan="15" class="muted" style="text-align:center;padding:16px">No workers on the roster.</td></tr>`}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="7">Total</td>
        <td class="num">${escapeHtml(fmtHours(total((r) => r.hoursWorked)))}</td>
        <td class="num">${escapeHtml(fmtHours(total((r) => r.overtimeHours)))}</td>
        <td class="num">${escapeHtml(formatCurrencyExact(total((r) => r.totalPay)))}</td>
        <td class="num">${escapeHtml(formatCurrency(total((r) => r.cashAdvance)))}</td>
        <td class="num">${escapeHtml(formatCurrency(total((r) => r.bankAdvance)))}</td>
        <td class="num">${escapeHtml(formatCurrencyExact(total((r) => r.netPay)))}</td>
        <td colspan="2"></td>
      </tr>
    </tfoot>
  </table>

  <div class="sheet-foot">
    <span>Net payable = (hours worked + overtime hours) × hourly rate − advances drawn.</span>
    <span>Prepared by ______________ · Approved by ______________</span>
  </div>
`;

  printDocument({
    title: `Payroll ${monthLabel}${scope}`,
    styles: STYLES,
    body: html,
  });
}

/** Hours print as whole numbers unless a half day made them fractional. */
function fmtHours(hours: number): string {
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(2);
}
