-- Advances drawn against a month's salary. One running figure per worker per
-- month, deducted from what's payable at month end.

create table if not exists public.salary_advances (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  month date not null, -- always the first of the month
  amount numeric(12, 2) not null default 0 check (amount >= 0),
  created_at timestamptz not null default now(),
  unique (employee_id, month)
);

create index if not exists salary_advances_month_idx on public.salary_advances (month);

alter table public.salary_advances enable row level security;

drop policy if exists "admin full access salary_advances" on public.salary_advances;
create policy "admin full access salary_advances" on public.salary_advances
  for all to authenticated
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
