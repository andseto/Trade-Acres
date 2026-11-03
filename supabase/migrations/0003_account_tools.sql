-- Trade Acres — account tools.
-- Lets a signed-in user permanently delete their own account.
-- Run this in the Supabase SQL editor after 0002_farm.sql.

-- Deleting the auth user cascades to profiles, accounts (plots), trades and journal_entries
-- (every table references auth.users with ON DELETE CASCADE).
-- SECURITY DEFINER lets this one function delete from auth.users on the caller's behalf, but it
-- only ever touches the row belonging to auth.uid(), so nobody can delete anyone else.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
