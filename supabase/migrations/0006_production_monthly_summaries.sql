-- Monthly dispatch totals for the Production tab, so admins can see how much
-- each agent handed out — and how much each customer received — per month.
-- security_invoker so the views run under the querying user's own RLS, matching
-- the other rollup views (migrations 0003 / 0005).

create view public.production_agent_monthly as
select
  agent_id,
  date_trunc('month', date)::date as month,
  sum(amount) as amount,
  count(*) as entries
from public.production_entries
group by agent_id, date_trunc('month', date);

alter view public.production_agent_monthly set (security_invoker = on);

create view public.production_customer_monthly as
select
  customer_id,
  date_trunc('month', date)::date as month,
  sum(amount) as amount,
  count(*) as entries
from public.production_entries
group by customer_id, date_trunc('month', date);

alter view public.production_customer_monthly set (security_invoker = on);
