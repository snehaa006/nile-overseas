-- Makes payroll history explainable after the fact.
--
-- A salary payment stores the net payable as a snapshot, so a later edit to
-- attendance can't rewrite what was actually handed over. That is the right
-- behaviour, but it left no way to tell WHY a paid row and today's payroll
-- disagree: reconciling July 2026 took arithmetic and guesswork, and two of
-- the five differences stayed undecidable (a ₹1,000 gap fits either 24 hours
-- of overtime or a ₹1,000 advance — the numbers are identical).
--
-- Two additions close that gap for good:
--   1. updated_at on the HR tables, so an edit after payday is visible.
--   2. The inputs of the pay calculation, snapshot onto the payment row
--      beside the amount, so any future mismatch names the input that moved.
--
-- Nothing here rewrites existing data. Columns are added empty: on the rows
-- that predate this migration they stay null, which honestly means "not
-- recorded" rather than asserting a time nobody captured.

-- ---------------------------------------------------------------------------
-- 1. updated_at across the HR tables
-- ---------------------------------------------------------------------------
-- Added without a default first: a default on `add column` would backfill
-- every existing row with now(), claiming July's rows were all touched today.
alter table public.employees add column if not exists updated_at timestamptz;
alter table public.attendance add column if not exists updated_at timestamptz;
alter table public.salary_advances add column if not exists updated_at timestamptz;
alter table public.salary_payments add column if not exists updated_at timestamptz;
alter table public.payroll_months add column if not exists updated_at timestamptz;

-- New rows stamp themselves; existing rows keep null until something edits them.
alter table public.employees alter column updated_at set default now();
alter table public.attendance alter column updated_at set default now();
alter table public.salary_advances alter column updated_at set default now();
alter table public.salary_payments alter column updated_at set default now();
alter table public.payroll_months alter column updated_at set default now();

comment on column public.attendance.updated_at is
  'Last edit. Null means the row has not been touched since before auditing was added (migration 0021) — not that it was never edited.';

drop trigger if exists employees_set_updated_at on public.employees;
create trigger employees_set_updated_at
  before update on public.employees
  for each row execute function public.set_updated_at();

drop trigger if exists attendance_set_updated_at on public.attendance;
create trigger attendance_set_updated_at
  before update on public.attendance
  for each row execute function public.set_updated_at();

drop trigger if exists salary_advances_set_updated_at on public.salary_advances;
create trigger salary_advances_set_updated_at
  before update on public.salary_advances
  for each row execute function public.set_updated_at();

drop trigger if exists salary_payments_set_updated_at on public.salary_payments;
create trigger salary_payments_set_updated_at
  before update on public.salary_payments
  for each row execute function public.set_updated_at();

drop trigger if exists payroll_months_set_updated_at on public.payroll_months;
create trigger payroll_months_set_updated_at
  before update on public.payroll_months
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 2. The pay calculation's inputs, snapshot beside the amount
-- ---------------------------------------------------------------------------
-- Net payable is
--   (salary / working_days / shift_hours) * (hours_worked + overtime_hours)
--     - (cash_advance + bank_advance)
-- so storing those six figures makes the amount reproducible from its own row.
-- A paid row that no longer matches today's payroll can then be diffed input
-- by input, instead of reverse-engineered from the total.
alter table public.salary_payments
  add column if not exists hours_worked numeric(7, 2),
  add column if not exists overtime_hours numeric(7, 2),
  add column if not exists cash_advance numeric(12, 2),
  add column if not exists bank_advance numeric(12, 2),
  add column if not exists salary numeric(12, 2),
  add column if not exists shift_hours numeric(4, 2),
  add column if not exists working_days integer;

comment on column public.salary_payments.salary is
  'The worker''s monthly salary as it stood when this payment was recorded — not their salary now. Null on rows paid before migration 0021.';
