// Row types mirroring supabase/migrations (0001_init.sql + 0002_farm.sql)

export type AccountType = "eval" | "funded" | "personal";
export type AccountStatus = "active" | "passed" | "blown" | "retired";
export type Direction = "long" | "short";
export type Emotion = "calm" | "confident" | "fomo" | "revenge" | "fearful" | "greedy" | "bored";
export type Mood = "great" | "good" | "meh" | "bad" | "awful";

export type CropId = "wheat" | "corn" | "carrot" | "tomato" | "pumpkin" | "strawberry" | "sunflower" | "blueberry";

export type Season = "spring" | "summer" | "fall" | "winter";

export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  farm_season: Season;
  created_at: string;
}

/** A trading account — shown on the farm as a plot of land growing one crop. */
export interface Account {
  id: string;
  user_id: string;
  name: string;
  firm: string | null;
  account_type: AccountType;
  account_size: number | null;
  profit_target: number | null;
  max_drawdown: number | null;
  status: AccountStatus;
  plot_name: string;
  crop: CropId;
  last_watered_at: string;
  water_count: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Trade {
  id: string;
  user_id: string;
  account_id: string;
  symbol: string;
  direction: Direction;
  quantity: number | null;
  entry_price: number | null;
  exit_price: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  pnl: number;
  fees: number;
  r_multiple: number | null;
  trade_date: string; // YYYY-MM-DD
  opened_at: string | null;
  closed_at: string | null;
  setup: string | null;
  tags: string[];
  emotion: Emotion | null;
  rating: number | null;
  followed_plan: boolean | null;
  notes: string | null;
  screenshots: string[]; // storage paths in the "screenshots" bucket
  created_at: string;
  updated_at: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  account_id: string | null;
  entry_date: string;
  title: string | null;
  mood: Mood | null;
  body: string | null;
  lessons: string | null;
  screenshots: string[];
  created_at: string;
  updated_at: string;
}
