-- Hours actually worked on a present day. Marking someone present fills this
-- with their shift length (12 by default), but a short day can be edited down
-- to 4 — and payroll then pays for 4 hours, not a full day.
--
-- With this, base pay becomes hours-based:
--   base pay = hours worked * hourly rate   (instead of days * day rate)

alter table public.attendance
  add column if not exists hours_worked numeric(5, 2) not null default 0
    check (hours_worked >= 0 and hours_worked <= 24);

-- Days already marked present predate this column: credit them a full shift.
update public.attendance a
set hours_worked = e.shift_hours
from public.employees e
where a.employee_id = e.id
  and a.status = 'present'
  and a.hours_worked = 0;
