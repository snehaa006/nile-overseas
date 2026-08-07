-- Advances are drawn either as cash from the office or as a bank transfer,
-- and the two are tracked separately. Total advance = cash + bank.

alter table public.salary_advances
  add column if not exists cash_advance numeric(12, 2) not null default 0
    check (cash_advance >= 0),
  add column if not exists bank_advance numeric(12, 2) not null default 0
    check (bank_advance >= 0);

-- Anything recorded before the split was handed over in cash.
update public.salary_advances
set cash_advance = amount
where amount > 0 and cash_advance = 0;

alter table public.salary_advances drop column if exists amount;
