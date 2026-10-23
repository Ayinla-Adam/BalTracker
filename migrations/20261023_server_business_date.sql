-- Return the current business date using Nigeria's local time zone.
-- This RPC exposes only the date, not user or business data.
create or replace function public.get_business_today()
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select ((now() at time zone 'Africa/Lagos')::date)::text;
$$;

revoke all on function public.get_business_today() from public;
revoke all on function public.get_business_today() from anon;
grant execute on function public.get_business_today() to authenticated;
