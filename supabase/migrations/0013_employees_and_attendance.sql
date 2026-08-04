-- HR management: the workforce roster and their day-by-day attendance.
-- Employee IDs are issued automatically (EMP-0001, EMP-0002, …) so staff only
-- ever type a name, designation and salary.

create sequence if not exists public.employee_code_seq start 1;

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  employee_code text not null unique
    default 'EMP-' || lpad(nextval('public.employee_code_seq')::text, 4, '0'),
  name text not null check (char_length(name) between 1 and 120),
  designation text not null check (char_length(designation) between 1 and 120),
  salary numeric(12, 2) not null default 0 check (salary >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists employees_active_name_idx
  on public.employees (is_active, name);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  work_date date not null,
  status text not null check (status in ('present', 'absent')),
  created_at timestamptz not null default now(),
  unique (employee_id, work_date)
);

create index if not exists attendance_work_date_idx on public.attendance (work_date);

alter table public.employees enable row level security;
alter table public.attendance enable row level security;

-- Payroll data is internal: staff only, no public read.
drop policy if exists "admin full access employees" on public.employees;
create policy "admin full access employees" on public.employees
  for all to authenticated
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "admin full access attendance" on public.attendance;
create policy "admin full access attendance" on public.attendance
  for all to authenticated
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
