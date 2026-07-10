-- Yearly counterparts to the monthly agent/customer dispatch summaries added
-- in migration 0006, so the Production tab can offer both a Monthly and a
-- Yearly view for agents and customers. security_invoker to match.

create view public.production_agent_yearly as
select
  agent_id,
  date_trunc('year', date)::date as year,
  sum(amount) as amount,
  count(*) as entries
from public.production_entries
group by agent_id, date_trunc('year', date);

alter view public.production_agent_yearly set (security_invoker = on);

create view public.production_customer_yearly as
select
  customer_id,
  date_trunc('year', date)::date as year,
  sum(amount) as amount,
  count(*) as entries
from public.production_entries
group by customer_id, date_trunc('year', date);

alter view public.production_customer_yearly set (security_invoker = on);
