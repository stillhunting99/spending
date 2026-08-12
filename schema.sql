-- ============================================================================
--  Spending Log — database setup
--  Paste this whole file into Supabase → SQL Editor → Run. One time only.
-- ============================================================================
--  Security note: the table has NO direct access for the public API key.
--  Everything goes through the three functions at the bottom, and each one
--  requires the household code. Someone who found your site's API key still
--  could not read your data without the household code, and could never read
--  anyone else's. That is why we do it this way instead of opening the table.
-- ============================================================================

create extension if not exists pgcrypto;

create table if not exists public.entries (
  id          uuid primary key default gen_random_uuid(),
  household   text        not null,
  person      text        not null default 'someone',
  spent_on    date        not null,
  category    text        not null,
  amount      numeric(10,2) not null check (amount > 0 and amount < 1000000),
  note        text        not null default '',
  created_at  timestamptz not null default now()
);

create index if not exists entries_household_idx
  on public.entries (household, spent_on desc, created_at desc);

-- Lock the table down completely. No policies = no direct reads or writes.
alter table public.entries enable row level security;
revoke all on public.entries from anon, authenticated;

-- ---------------------------------------------------------------- read ----
create or replace function public.list_entries(p_household text)
returns setof public.entries
language sql
security definer
set search_path = public
as $$
  select * from public.entries
   where household = p_household
   order by spent_on desc, created_at desc
   limit 5000;
$$;

-- --------------------------------------------------------------- write ----
create or replace function public.log_entry(
  p_household text, p_person text, p_spent_on date,
  p_category text, p_amount numeric, p_note text)
returns public.entries
language plpgsql
security definer
set search_path = public
as $$
declare r public.entries;
begin
  if p_household is null or length(p_household) < 20 then
    raise exception 'invalid household';
  end if;
  insert into public.entries (household, person, spent_on, category, amount, note)
  values (p_household,
          coalesce(nullif(btrim(p_person), ''), 'someone'),
          p_spent_on, p_category, p_amount,
          left(coalesce(p_note, ''), 120))
  returning * into r;
  return r;
end $$;

-- -------------------------------------------------------------- delete ----
create or replace function public.delete_entry(p_household text, p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.entries where id = p_id and household = p_household;
  return found;
end $$;

-- Expose only the functions.
grant execute on function public.list_entries(text)                                   to anon, authenticated;
grant execute on function public.log_entry(text, text, date, text, numeric, text)      to anon, authenticated;
grant execute on function public.delete_entry(text, uuid)                              to anon, authenticated;

-- Done. You should see "Success. No rows returned."
