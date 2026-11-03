-- Trading Tank — initial schema
-- Run this in the Supabase SQL editor (or via `supabase db push`).

-- ───────────────────────────── profiles ─────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  display_name text,
  tank_theme text not null default 'reef',          -- reef | deep | lagoon | night
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────────────────────── accounts (= fish) ─────────────────────────────
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  -- trading account
  name text not null,                                   -- e.g. "Apex 50k #2"
  firm text,                                            -- e.g. "Apex", "Topstep", "FTMO"
  account_type text not null default 'eval'
    check (account_type in ('eval', 'funded', 'personal')),
  account_size numeric(14, 2),                          -- nominal size, e.g. 50000
  profit_target numeric(14, 2),                         -- eval target (optional)
  max_drawdown numeric(14, 2),                          -- trailing / max loss (optional)
  status text not null default 'active'
    check (status in ('active', 'passed', 'blown', 'retired')),

  -- the fish
  fish_name text not null,
  species text not null default 'goldfish',
  color text not null default '#ff9f1c',               -- primary body colour (hex)

  -- feeding
  last_fed_at timestamptz not null default now(),
  feed_count integer not null default 0,

  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists accounts_user_idx on public.accounts (user_id);

-- ───────────────────────────── trades ─────────────────────────────
create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete cascade,

  symbol text not null,
  direction text not null check (direction in ('long', 'short')),
  quantity numeric(14, 4),
  entry_price numeric(18, 6),
  exit_price numeric(18, 6),
  stop_loss numeric(18, 6),
  take_profit numeric(18, 6),
  pnl numeric(14, 2) not null default 0,                -- net P&L after fees
  fees numeric(14, 2) not null default 0,
  r_multiple numeric(8, 2),

  trade_date date not null default current_date,        -- drives the P&L calendar
  opened_at timestamptz,
  closed_at timestamptz,

  setup text,                                           -- strategy / setup name
  tags text[] not null default '{}',
  emotion text,                                         -- calm | confident | fomo | revenge | fearful | greedy | bored
  rating smallint check (rating between 1 and 5),       -- execution rating
  followed_plan boolean,
  notes text,
  screenshots text[] not null default '{}',             -- storage object paths in the `screenshots` bucket

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists trades_user_date_idx on public.trades (user_id, trade_date desc);
create index if not exists trades_account_idx on public.trades (account_id);

-- ───────────────────────────── journal entries (daily notes) ─────────────────────────────
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid references public.accounts (id) on delete cascade,  -- null = feeds every active fish
  entry_date date not null default current_date,
  title text,
  mood text,                                            -- great | good | meh | bad | awful
  body text,                                            -- pre-market plan / review
  lessons text,
  screenshots text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists journal_user_date_idx on public.journal_entries (user_id, entry_date desc);

-- ───────────────────────────── feeding ─────────────────────────────
-- Journaling feeds fish: any new trade / journal entry bumps last_fed_at on its account.
-- A journal entry with no account feeds every active fish the user owns.
create or replace function public.feed_fish()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.account_id is not null then
    update public.accounts
       set last_fed_at = now(), feed_count = feed_count + 1
     where id = new.account_id and user_id = new.user_id;
  else
    update public.accounts
       set last_fed_at = now(), feed_count = feed_count + 1
     where user_id = new.user_id and status = 'active';
  end if;
  return new;
end;
$$;

drop trigger if exists trades_feed on public.trades;
create trigger trades_feed after insert on public.trades
  for each row execute function public.feed_fish();

drop trigger if exists journal_feed on public.journal_entries;
create trigger journal_feed after insert on public.journal_entries
  for each row execute function public.feed_fish();

-- updated_at bookkeeping
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists accounts_touch on public.accounts;
create trigger accounts_touch before update on public.accounts for each row execute function public.touch_updated_at();
drop trigger if exists trades_touch on public.trades;
create trigger trades_touch before update on public.trades for each row execute function public.touch_updated_at();
drop trigger if exists journal_touch on public.journal_entries;
create trigger journal_touch before update on public.journal_entries for each row execute function public.touch_updated_at();

-- ───────────────────────────── row level security ─────────────────────────────
alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.trades enable row level security;
alter table public.journal_entries enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "own accounts" on public.accounts;
create policy "own accounts" on public.accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own trades" on public.trades;
create policy "own trades" on public.trades
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own journal" on public.journal_entries;
create policy "own journal" on public.journal_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ───────────────────────────── storage: screenshots ─────────────────────────────
-- Private bucket. Objects live under "<user_id>/..." so users only see their own.
insert into storage.buckets (id, name, public)
values ('screenshots', 'screenshots', false)
on conflict (id) do nothing;

drop policy if exists "screenshots read own" on storage.objects;
create policy "screenshots read own" on storage.objects
  for select using (bucket_id = 'screenshots' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "screenshots write own" on storage.objects;
create policy "screenshots write own" on storage.objects
  for insert with check (bucket_id = 'screenshots' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "screenshots delete own" on storage.objects;
create policy "screenshots delete own" on storage.objects
  for delete using (bucket_id = 'screenshots' and (storage.foldername(name))[1] = auth.uid()::text);
