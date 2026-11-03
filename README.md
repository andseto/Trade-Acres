# 🌱 Trade Acres

A trading journal where every funded account and eval is a plot on your pixel farm.
Journal your trades to water your crops — and keep your accounts alive.

## Setup

1. **Env vars.** Fill in `.env.local` (template in `.env.example`):
   - `NEXT_PUBLIC_SUPABASE_URL`: Supabase → Project Settings → API → Project URL
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: the `sb_publishable_...` key
   - `NEXT_PUBLIC_SITE_URL`: `http://localhost:3000` locally, your domain in production
2. **Database.** In Supabase → SQL Editor, run each file in `supabase/migrations/` in order:
   - `0001_init.sql` creates the tables, row-level security, and the private `screenshots` storage bucket.
   - `0002_farm.sql` converts the original fish-tank columns to the farm (plots, crops, watering, seasons).
3. **Auth URLs.** In Supabase → Authentication → URL Configuration, set the Site URL to your site, then add
   `http://localhost:3000/auth/callback` (and your production equivalent) to Redirect URLs.
   - *Optional: email links on any device.* In Authentication → Email Templates, point the links at `/auth/confirm`:
     - Confirm signup and Magic link: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/farm`
     - Reset password: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password`
   - *Optional: Google sign-in.* Enable the Google provider under Authentication → Providers.
4. **Run it:**
   ```bash
   npm install
   npm run dev
   ```
   Then open http://localhost:3000.

## How the farm works

Each account is a plot growing one crop: wheat, corn, carrot, tomato, pumpkin, strawberry, sunflower or blueberry.

**Watering.** Logging a trade waters that account's plot. A daily journal entry with no account selected waters every active plot.
Watering happens in the database (`water_plots()` trigger), so it can't be faked from the client.

| Time since last journal entry | Soil |
| --- | --- |
| < 6h | Freshly watered |
| < 24h | Moist |
| < 48h | Dry |
| < 96h | Parched |
| 96h+ | Withering |

**Growth.** Crops grow with every journal entry: seed (0) → sprout (1) → growing (4) → mature (10) → ripe (20).

- Account marked **blown** → the crop dies 💀
- Eval marked **passed** → golden harvest 🏆
- Account **retired** → the plot lies fallow

Seasons (spring, summer, fall, winter) are a setting on the Settings page.

## Stack

Next.js 16 (App Router) · React 19 · Tailwind v4 · Supabase (Auth, Postgres, Storage)
