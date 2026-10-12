-- BalTracker integration migration
-- Run this once in Supabase SQL Editor after reviewing the SQL.
-- Adds vendor records, stable app IDs, and transaction party fields while preserving the existing schema.

create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id)
);

create index if not exists vendors_user_name_idx on public.vendors(user_id, name);
alter table public.vendors enable row level security;

drop policy if exists vendors_select_own on public.vendors;
create policy vendors_select_own on public.vendors for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists vendors_insert_own on public.vendors;
create policy vendors_insert_own on public.vendors for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists vendors_update_own on public.vendors;
create policy vendors_update_own on public.vendors for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists vendors_delete_own on public.vendors;
create policy vendors_delete_own on public.vendors for delete to authenticated using ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.vendors to authenticated;

alter table public.transactions add column if not exists party_name text;
alter table public.transactions add column if not exists party_type text;
alter table public.transactions drop constraint if exists transactions_party_type_check;
alter table public.transactions add constraint transactions_party_type_check
  check (party_type is null or party_type in ('customer', 'vendor'));

create or replace function public.set_updated_at()
returns trigger language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists vendors_set_updated_at on public.vendors;
create trigger vendors_set_updated_at before update on public.vendors
for each row execute function public.set_updated_at();

-- Stable app-generated IDs let BalTracker preserve its existing local transaction
-- identifiers while Supabase uses UUID primary keys internally.
alter table public.transactions add column if not exists app_id text;
create unique index if not exists transactions_user_app_id_uidx
  on public.transactions(user_id, app_id) where app_id is not null;

alter table public.debt_payments add column if not exists app_id text;
create unique index if not exists debt_payments_user_app_id_uidx
  on public.debt_payments(user_id, app_id) where app_id is not null;

alter table public.customers add column if not exists app_id text;
create unique index if not exists customers_user_app_id_uidx
  on public.customers(user_id, app_id) where app_id is not null;

alter table public.vendors add column if not exists app_id text;
create unique index if not exists vendors_user_app_id_uidx
  on public.vendors(user_id, app_id) where app_id is not null;
