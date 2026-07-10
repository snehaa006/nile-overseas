-- Two new admin workflows:
--   1. Process tracking — daily per-process production entries across the four
--      machines/processes (Raschal, Polish, Printing, Brushing). Each entry
--      records how many rolls and kilograms were produced for a given blanket.
--   2. Production dispatch — which agent handed how many pieces to which
--      customer. Agents and customers live in their own tables so the UI can
--      offer them as dropdowns instead of free text.

-- ---------------------------------------------------------------------------
-- 1. Process entries
-- ---------------------------------------------------------------------------
create table public.process_entries (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  process text not null check (process in ('raschal', 'polish', 'printing', 'brushing')),
  blanket_id uuid references public.blankets(id) on delete restrict,
  roll numeric not null default 0,
  kg numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index process_entries_date_idx on public.process_entries (date);
create index process_entries_process_idx on public.process_entries (process);

alter table public.process_entries enable row level security;

create policy "admin full access process entries" on public.process_entries
  for all to authenticated
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create trigger trg_process_entries_updated_at
  before update on public.process_entries
  for each row execute function public.set_updated_at();

-- Monthly / yearly per-process rollups. security_invoker so they run under the
-- querying user's own RLS (matching the stock rollup views in migration 0003).
create view public.process_monthly_totals as
select
  process,
  date_trunc('month', date)::date as month,
  sum(roll) as roll,
  sum(kg) as kg,
  count(*) as entries
from public.process_entries
group by process, date_trunc('month', date);

alter view public.process_monthly_totals set (security_invoker = on);

create view public.process_yearly_totals as
select
  process,
  date_trunc('year', date)::date as year,
  sum(roll) as roll,
  sum(kg) as kg,
  count(*) as entries
from public.process_entries
group by process, date_trunc('year', date);

alter view public.process_yearly_totals set (security_invoker = on);

-- ---------------------------------------------------------------------------
-- 2. Agents & customers (dropdown sources for production entries)
-- ---------------------------------------------------------------------------
create table public.agents (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

alter table public.agents enable row level security;
alter table public.customers enable row level security;

create policy "admin full access agents" on public.agents
  for all to authenticated
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "admin full access customers" on public.customers
  for all to authenticated
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- 3. Production entries — agent dispatched `amount` pieces to a customer
-- ---------------------------------------------------------------------------
create table public.production_entries (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  agent_id uuid references public.agents(id) on delete restrict,
  customer_id uuid references public.customers(id) on delete restrict,
  amount numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index production_entries_date_idx on public.production_entries (date);

alter table public.production_entries enable row level security;

create policy "admin full access production entries" on public.production_entries
  for all to authenticated
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create trigger trg_production_entries_updated_at
  before update on public.production_entries
  for each row execute function public.set_updated_at();
