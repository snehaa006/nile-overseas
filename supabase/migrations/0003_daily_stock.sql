-- Move production/sales/stock tracking from monthly to date-wise entries.
-- Opening stock still carries forward automatically — day to day now,
-- instead of month to month — which means monthly and yearly totals are
-- simply rollups over a contiguous run of days.

-- 1. New table: one row per (blanket_id, date)
create table public.daily_stock (
  id uuid primary key default gen_random_uuid(),
  blanket_id uuid not null references public.blankets(id) on delete restrict,
  date date not null,
  opening_stock numeric not null default 0,
  production numeric not null default 0,
  sales numeric not null default 0,
  closing_stock numeric generated always as (opening_stock + production - sales) stored,
  is_locked boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (blanket_id, date)
);

alter table public.daily_stock enable row level security;

create policy "admin full access daily stock" on public.daily_stock
  for all to authenticated
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- 2. Carry-forward triggers (day-based equivalents of the old month-based ones)
create or replace function public.set_opening_from_prior_day()
returns trigger
language plpgsql
set search_path to ''
as $function$
declare
  prior_closing numeric;
begin
  select ds.closing_stock into prior_closing
  from public.daily_stock ds
  where ds.blanket_id = new.blanket_id
    and ds.date < new.date
  order by ds.date desc
  limit 1;

  if prior_closing is not null then
    new.opening_stock := prior_closing;
  end if;

  return new;
end;
$function$;

create or replace function public.cascade_opening_to_next_day()
returns trigger
language plpgsql
set search_path to ''
as $function$
begin
  update public.daily_stock nxt
  set opening_stock = new.closing_stock
  where nxt.blanket_id = new.blanket_id
    and nxt.date = (
      select min(ds.date) from public.daily_stock ds
      where ds.blanket_id = new.blanket_id and ds.date > new.date
    )
    and nxt.is_locked = false
    and nxt.opening_stock is distinct from new.closing_stock;
  return new;
end;
$function$;

create trigger trg_set_opening_from_prior_day
  before insert on public.daily_stock
  for each row execute function public.set_opening_from_prior_day();

create trigger trg_cascade_opening_to_next_day
  after insert or update of opening_stock, production, sales on public.daily_stock
  for each row execute function public.cascade_opening_to_next_day();

-- Reuse the existing generic trigger functions (they don't reference a
-- specific table): lock enforcement and updated_at bookkeeping.
create trigger trg_prevent_locked_stock_edit
  before update on public.daily_stock
  for each row execute function public.prevent_locked_stock_edit();

create trigger trg_daily_stock_updated_at
  before update on public.daily_stock
  for each row execute function public.set_updated_at();

-- 3. Migrate existing monthly rows onto the first day of their month, so
-- history/totals are preserved once daily entry takes over from here.
insert into public.daily_stock
  (blanket_id, date, opening_stock, production, sales, is_locked, notes, created_at, updated_at)
select blanket_id, month, opening_stock, production, sales, is_locked, notes, created_at, updated_at
from public.monthly_stock
order by month;

-- 4. Retire the old table. Archived (not dropped) so no history is lost;
-- the app no longer reads or writes it.
drop view if exists public.product_monthly_summary;
alter table public.monthly_stock rename to monthly_stock_archive;
comment on table public.monthly_stock_archive is
  'Superseded by daily_stock (date-wise entry, see migration 0003). Kept only as a historical archive — not read by the app.';

-- 5. Rollup views. security_invoker so they run under the querying user's
-- own RLS, matching the hardening already applied to product_monthly_summary.
create view public.blanket_monthly_stock as
select
  ds.blanket_id,
  date_trunc('month', ds.date)::date as month,
  (array_agg(ds.opening_stock order by ds.date asc))[1] as opening_stock,
  sum(ds.production) as production,
  sum(ds.sales) as sales,
  (array_agg(ds.closing_stock order by ds.date desc))[1] as closing_stock,
  count(*) as days_recorded
from public.daily_stock ds
group by ds.blanket_id, date_trunc('month', ds.date);

alter view public.blanket_monthly_stock set (security_invoker = on);

create view public.blanket_yearly_stock as
select
  ds.blanket_id,
  date_trunc('year', ds.date)::date as year,
  (array_agg(ds.opening_stock order by ds.date asc))[1] as opening_stock,
  sum(ds.production) as production,
  sum(ds.sales) as sales,
  (array_agg(ds.closing_stock order by ds.date desc))[1] as closing_stock,
  count(*) as days_recorded
from public.daily_stock ds
group by ds.blanket_id, date_trunc('year', ds.date);

alter view public.blanket_yearly_stock set (security_invoker = on);

create view public.blanket_latest_stock as
select distinct on (ds.blanket_id)
  ds.blanket_id, ds.date, ds.closing_stock
from public.daily_stock ds
order by ds.blanket_id, ds.date desc;

alter view public.blanket_latest_stock set (security_invoker = on);

create view public.product_monthly_summary as
select
  p.id as product_id,
  p.name as product_name,
  bms.month,
  sum(bms.production) as total_production,
  sum(bms.sales) as total_sales,
  sum(bms.closing_stock) as total_stock
from public.blanket_monthly_stock bms
join public.blankets b on b.id = bms.blanket_id
join public.products p on p.id = b.product_id
group by p.id, p.name, bms.month;

alter view public.product_monthly_summary set (security_invoker = on);

create view public.product_yearly_summary as
select
  p.id as product_id,
  p.name as product_name,
  bys.year,
  sum(bys.production) as total_production,
  sum(bys.sales) as total_sales,
  sum(bys.closing_stock) as total_stock
from public.blanket_yearly_stock bys
join public.blankets b on b.id = bys.blanket_id
join public.products p on p.id = b.product_id
group by p.id, p.name, bys.year;

alter view public.product_yearly_summary set (security_invoker = on);
