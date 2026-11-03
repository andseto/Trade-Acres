-- Trade Acres — fish tank → farm.
-- Accounts are now plots of land with a crop; journaling waters them.
-- Run this in the Supabase SQL editor after 0001_init.sql.

-- ───────────────────────────── accounts → plots ─────────────────────────────
alter table public.accounts rename column fish_name to plot_name;
alter table public.accounts rename column species to crop;
alter table public.accounts rename column last_fed_at to last_watered_at;
alter table public.accounts rename column feed_count to water_count;
alter table public.accounts drop column if exists color;

-- map the old fish species onto crops
update public.accounts set crop = case crop
  when 'goldfish' then 'wheat'
  when 'clownfish' then 'carrot'
  when 'betta' then 'blueberry'
  when 'angelfish' then 'sunflower'
  when 'pufferfish' then 'pumpkin'
  when 'bluetang' then 'tomato'
  when 'koi' then 'strawberry'
  when 'shark' then 'corn'
  else crop
end;
alter table public.accounts alter column crop set default 'wheat';

-- ───────────────────────────── profiles: tank theme → season ─────────────────────────────
alter table public.profiles rename column tank_theme to farm_season;
alter table public.profiles alter column farm_season set default 'spring';
update public.profiles set farm_season = 'spring';

-- ───────────────────────────── watering ─────────────────────────────
-- Journaling waters plots: any new trade / journal entry bumps last_watered_at on its account.
-- A journal entry with no account waters every active plot the user owns.
drop trigger if exists trades_feed on public.trades;
drop trigger if exists journal_feed on public.journal_entries;
drop function if exists public.feed_fish();

create or replace function public.water_plots()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.account_id is not null then
    update public.accounts
       set last_watered_at = now(), water_count = water_count + 1
     where id = new.account_id and user_id = new.user_id;
  else
    update public.accounts
       set last_watered_at = now(), water_count = water_count + 1
     where user_id = new.user_id and status = 'active';
  end if;
  return new;
end;
$$;

create trigger trades_water after insert on public.trades
  for each row execute function public.water_plots();

create trigger journal_water after insert on public.journal_entries
  for each row execute function public.water_plots();
