import { escapeHtml, printDocument } from "@/shared/utils/pdf";
import {
  dateKey,
  formatCurrency,
  formatCurrencyExact,
  formatDate,
  formatMonth,
} from "@/shared/utils/format";
import type { PayrollRow, SalaryPayment } from "@/shared/types/models";

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
}): void {
  const { month, workingDays, rows, paymentsByEmployee } = args;
  const monthLabel = formatMonth(`${month}-01`);
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
              ? `<span class="pill paid">Paid</span><span class="on">${escapeHtml(
                  formatDate(payment.paid_on),
                )}</span>`
              : `<span class="pill unpaid">Unpaid</span>`
          }</td>
          <td class="sign"></td>
        </tr>`;
    })
    .join("");

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(`Payroll ${monthLabel}`)}</title>
<style>
  @page { size: A4 landscape; margin: 12mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: ui-sans-serif, system-ui, "Segoe UI", Helvetica, Arial, sans-serif;
    color: #1c1917;
    font-size: 10px;
  }
  header { border-bottom: 2px solid #1c1917; padding-bottom: 8px; margin-bottom: 12px; }
  .company { font-size: 18px; font-weight: 700; letter-spacing: 0.02em; }
  .title { font-size: 12px; margin-top: 2px; }
  .generated { float: right; text-align: right; font-size: 9px; color: #78716c; }
  .summary { display: flex; gap: 8px; margin-bottom: 12px; }
  .tile { flex: 1; border: 1px solid #e7e5e4; border-radius: 6px; padding: 6px 8px; }
  .tile .label { font-size: 8px; text-transform: uppercase; letter-spacing: 0.06em; color: #78716c; }
  .tile .value { font-size: 13px; font-weight: 700; margin-top: 2px; }
  .tile.paid { border-color: #a7f3d0; background: #ecfdf5; }
  .tile.paid .value { color: #065f46; }
  .tile.due { border-color: #fecdd3; background: #fff1f2; }
  .tile.due .value { color: #9f1239; }
  table { width: 100%; border-collapse: collapse; }
  thead { display: table-header-group; }
  th, td { border: 1px solid #e7e5e4; padding: 4px 6px; text-align: left; vertical-align: middle; }
  th { background: #f5f5f4; font-size: 8px; text-transform: uppercase; letter-spacing: 0.04em; color: #57534e; }
  tr { page-break-inside: avoid; }
  .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .muted { color: #78716c; }
  .code { font-family: ui-monospace, "SFMono-Regular", Menlo, monospace; font-size: 9px; }
  .strong { font-weight: 700; }
  tfoot td { background: #f5f5f4; font-weight: 700; }
  .status { text-align: center; white-space: nowrap; }
  .pill { display: inline-block; border-radius: 999px; padding: 1px 6px; font-size: 8px; font-weight: 700; }
  .pill.paid { background: #d1fae5; color: #065f46; }
  .pill.unpaid { background: #ffe4e6; color: #9f1239; }
  .on { display: block; font-size: 8px; color: #78716c; margin-top: 1px; }
  .sign { width: 90px; }
  footer { margin-top: 14px; font-size: 9px; color: #78716c; display: flex; justify-content: space-between; }
</style>
</head>
<body>
  <header>
    <div class="generated">
      Generated ${escapeHtml(formatDate(dateKey()))}<br />
      Working days: ${workingDays}
    </div>
    <div class="company">Nile Overseas</div>
    <div class="title">Salary sheet — ${escapeHtml(monthLabel)}</div>
  </header>

  <section class="summary">
    <div class="tile"><div class="label">Workers</div><div class="value">${rows.length}</div></div>
    <div class="tile"><div class="label">Hours worked</div><div class="value">${escapeHtml(fmtHours(total((r) => r.hoursWorked)))}</div></div>
    <div class="tile"><div class="label">Overtime hours</div><div class="value">${escapeHtml(fmtHours(total((r) => r.overtimeHours)))}</div></div>
    <div class="tile"><div class="label">Advances</div><div class="value">${escapeHtml(formatCurrency(total((r) => r.advance)))}</div></div>
    <div class="tile"><div class="label">Net payable</div><div class="value">${escapeHtml(formatCurrency(total((r) => r.netPay)))}</div></div>
    <div class="tile paid"><div class="label">Paid (${paidRows.length})</div><div class="value">${escapeHtml(formatCurrency(paidTotal))}</div></div>
    <div class="tile due"><div class="label">Outstanding (${unpaidRows.length})</div><div class="value">${escapeHtml(formatCurrency(outstanding))}</div></div>
  </section>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>ID</th>
        <th>Worker</th>
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
      ${body || `<tr><td colspan="14" class="muted" style="text-align:center;padding:16px">No workers on the roster.</td></tr>`}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="6">Total</td>
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

  <footer>
    <span>Net payable = (hours worked + overtime hours) × hourly rate − advances drawn.</span>
    <span>Prepared by ______________  ·  Approved by ______________</span>
  </footer>
</body>
</html>`;

  printDocument(`Payroll ${monthLabel}`, html);
}

/** Hours print as whole numbers unless a half day made them fractional. */
function fmtHours(hours: number): string {
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(2);
}
