-- HR is owner-only. Other admin accounts share the dashboard but must not be
-- able to read salaries, attendance or advances — hiding the menu is not
-- enough, since anyone signed in could otherwise query the tables directly.
--
-- Keep this list in step with HR_ADMIN_EMAILS in src/shared/lib/access.ts.

create or replace function public.hr_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) in (
    'sneha203btcse24@igdtuw.ac.in'
  );
$$;

drop policy if exists "admin full access employees" on public.employees;
create policy "hr admin full access employees" on public.employees
  for all to authenticated
  using (public.hr_admin())
  with check (public.hr_admin());

drop policy if exists "admin full access attendance" on public.attendance;
create policy "hr admin full access attendance" on public.attendance
  for all to authenticated
  using (public.hr_admin())
  with check (public.hr_admin());

drop policy if exists "admin full access payroll_months" on public.payroll_months;
create policy "hr admin full access payroll_months" on public.payroll_months
  for all to authenticated
  using (public.hr_admin())
  with check (public.hr_admin());

drop policy if exists "admin full access salary_advances" on public.salary_advances;
create policy "hr admin full access salary_advances" on public.salary_advances
  for all to authenticated
  using (public.hr_admin())
  with check (public.hr_admin());
