-- BalTracker: add optional payment due dates for credit/debit reminders.
-- Safe to run more than once.
alter table public.transactions
  add column if not exists due_date date;

create index if not exists transactions_user_due_date_idx
  on public.transactions (user_id, due_date)
  where due_date is not null;
