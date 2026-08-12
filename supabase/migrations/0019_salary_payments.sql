-- Salary payouts: which workers have actually been paid for a month.
--
-- Payroll already derives what is *owed* from attendance and advances. This
-- records the other half — what has been *handed over*. A row means paid; no
-- row means still outstanding, so un-marking is a delete rather than a flag
-- flip and the table stays a clean list of settled payouts.
--
-- `amount` snapshots the net payable at the moment it was marked, so a later
-- attendance correction never silently rewrites what was recorded as paid.

create table if not exists public.salary_payments (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  month date not null, -- always the first of the month
  amount numeric(12, 2) not null default 0,
  paid_on date not null default current_date,
  created_at timestamptz not null default now(),
  unique (employee_id, month)
);

create index if not exists salary_payments_month_idx on public.salary_payments (month);

alter table public.salary_payments enable row level security;

-- HR is owner-only, same as the rest of the payroll tables (migration 0018).
drop policy if exists "hr admin full access salary_payments" on public.salary_payments;
create policy "hr admin full access salary_payments" on public.salary_payments
  for all to authenticated
  using (public.hr_admin())
  with check (public.hr_admin());
