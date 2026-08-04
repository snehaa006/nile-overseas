-- Payroll: turn attendance into money.
--
--   day rate    = monthly salary / working days in that month   (23000 / 26)
--   hourly rate = day rate / shift hours                        (884.62 / 12)
--   earned      = days present * day rate + overtime hours * hourly rate
--
-- Working days differ month to month, so they are stored per month rather
-- than derived from the calendar.

alter table public.employees
  add column if not exists shift_hours numeric(4, 2) not null default 12
    check (shift_hours > 0 and shift_hours <= 24);

alter table public.attendance
  add column if not exists overtime_hours numeric(5, 2) not null default 0
    check (overtime_hours >= 0 and overtime_hours <= 24);

create table if not exists public.payroll_months (
  month date primary key, -- always the first of the month
  working_days integer not null check (working_days between 1 and 31),
  created_at timestamptz not null default now()
);

alter table public.payroll_months enable row level security;

drop policy if exists "admin full access payroll_months" on public.payroll_months;
create policy "admin full access payroll_months" on public.payroll_months
  for all to authenticated
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
