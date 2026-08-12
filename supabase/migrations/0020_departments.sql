-- Departments: which part of the floor a worker belongs to.
--
-- A lookup table rather than free text on the employee, so the roster can be
-- filtered and totalled by department without spelling variants ("raschal",
-- "Raschal", "raschel") splitting the same group into three.

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 80),
  created_at timestamptz not null default now()
);

-- The two departments on the floor today. More can be added later.
insert into public.departments (name)
values ('Raschal'), ('Finishing')
on conflict (name) do nothing;

alter table public.employees
  add column if not exists department_id uuid
    references public.departments (id) on delete set null;

create index if not exists employees_department_idx
  on public.employees (department_id);

-- Everyone on the roster at the time of this migration works in Raschal;
-- Finishing is staffed by assigning workers to it from here on.
update public.employees
set department_id = (select id from public.departments where name = 'Raschal')
where department_id is null;

alter table public.departments enable row level security;

-- Departments are part of the HR record, so they follow the same owner-only
-- rule as the rest of it (migration 0018).
drop policy if exists "hr admin full access departments" on public.departments;
create policy "hr admin full access departments" on public.departments
  for all to authenticated
  using (public.hr_admin())
  with check (public.hr_admin());
