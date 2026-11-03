import type { Emotion, Mood } from "@/lib/types";

export const EMOTIONS: { id: Emotion; label: string; emoji: string }[] = [
  { id: "calm", label: "Calm", emoji: "😌" },
  { id: "confident", label: "Confident", emoji: "😎" },
  { id: "fomo", label: "FOMO", emoji: "😱" },
  { id: "revenge", label: "Revenge", emoji: "😤" },
  { id: "fearful", label: "Fearful", emoji: "😨" },
  { id: "greedy", label: "Greedy", emoji: "🤑" },
  { id: "bored", label: "Bored", emoji: "🥱" },
];

export const EMOTION_BY_ID = Object.fromEntries(EMOTIONS.map((e) => [e.id, e])) as Record<
  Emotion,
  (typeof EMOTIONS)[number]
>;

export const MOODS: { id: Mood; label: string; emoji: string }[] = [
  { id: "great", label: "Great", emoji: "🤩" },
  { id: "good", label: "Good", emoji: "🙂" },
  { id: "meh", label: "Meh", emoji: "😐" },
  { id: "bad", label: "Bad", emoji: "🙁" },
  { id: "awful", label: "Awful", emoji: "😵" },
];

export const MOOD_BY_ID = Object.fromEntries(MOODS.map((m) => [m.id, m])) as Record<Mood, (typeof MOODS)[number]>;

/** Dollar value of a 1.0 price move per contract. Matched against the symbol prefix. */
export const POINT_VALUES: { symbol: string; label: string; value: number }[] = [
  { symbol: "MES", label: "MES · $5", value: 5 },
  { symbol: "MNQ", label: "MNQ · $2", value: 2 },
  { symbol: "MYM", label: "MYM · $0.50", value: 0.5 },
  { symbol: "M2K", label: "M2K · $5", value: 5 },
  { symbol: "MGC", label: "MGC · $10", value: 10 },
  { symbol: "MCL", label: "MCL · $100", value: 100 },
  { symbol: "ES", label: "ES · $50", value: 50 },
  { symbol: "NQ", label: "NQ · $20", value: 20 },
  { symbol: "YM", label: "YM · $5", value: 5 },
  { symbol: "RTY", label: "RTY · $50", value: 50 },
  { symbol: "CL", label: "CL · $1,000", value: 1000 },
  { symbol: "GC", label: "GC · $100", value: 100 },
];

/** Guess a futures point value from a symbol like "NQZ6" or "MESH27". Returns 1 for stocks. */
export function guessPointValue(symbol: string): number {
  const s = symbol.trim().toUpperCase();
  if (!s) return 1;
  // longest prefixes first so MES wins over ES
  const sorted = [...POINT_VALUES].sort((a, b) => b.symbol.length - a.symbol.length);
  for (const p of sorted) {
    if (s === p.symbol || (s.startsWith(p.symbol) && /^[FGHJKMNQUVXZ]\d{1,2}$/.test(s.slice(p.symbol.length)))) {
      return p.value;
    }
  }
  return 1;
}

export const PAGE_SIZE = 30;
