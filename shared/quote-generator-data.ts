/**
 * Reference data for the Rep Quote Generator (from rep quote fixed.xlsx).
 * Rep tiers: Rookie 1–5 (idx 1–5), Starter 1–5 (6–10), Veteran 1–5 (11–15), Legend 1–5 (16–20).
 */

export interface RepPricingRow {
  fromLabel: string;
  toLabel: string;
  fromTier: string;
  fromLvl: number;
  toTier: string;
  toLvl: number;
  fromIdx: number;
  toIdx: number;
  rate: number;
  fullBar: number;
  isPricedBar: number;
}

export const REP_PRICING: RepPricingRow[] = [
  { fromLabel: "Rookie 1", toLabel: "Rookie 2", fromTier: "Rookie", fromLvl: 1, toTier: "Rookie", toLvl: 2, fromIdx: 1, toIdx: 2, rate: 0.2, fullBar: 20, isPricedBar: 1 },
  { fromLabel: "Rookie 2", toLabel: "Rookie 3", fromTier: "Rookie", fromLvl: 2, toTier: "Rookie", toLvl: 3, fromIdx: 2, toIdx: 3, rate: 0.25, fullBar: 25, isPricedBar: 1 },
  { fromLabel: "Rookie 3", toLabel: "Rookie 4", fromTier: "Rookie", fromLvl: 3, toTier: "Rookie", toLvl: 4, fromIdx: 3, toIdx: 4, rate: 0.3, fullBar: 30, isPricedBar: 1 },
  { fromLabel: "Rookie 4", toLabel: "Rookie 5", fromTier: "Rookie", fromLvl: 4, toTier: "Rookie", toLvl: 5, fromIdx: 4, toIdx: 5, rate: 0.35, fullBar: 35, isPricedBar: 1 },
  { fromLabel: "Rookie 5", toLabel: "Starter 1", fromTier: "Rookie", fromLvl: 5, toTier: "Starter", toLvl: 1, fromIdx: 5, toIdx: 6, rate: 0.4, fullBar: 40, isPricedBar: 1 },
  { fromLabel: "Starter 1", toLabel: "Starter 2", fromTier: "Starter", fromLvl: 1, toTier: "Starter", toLvl: 2, fromIdx: 6, toIdx: 7, rate: 1.25, fullBar: 125, isPricedBar: 1 },
  { fromLabel: "Starter 2", toLabel: "Starter 3", fromTier: "Starter", fromLvl: 2, toTier: "Starter", toLvl: 3, fromIdx: 7, toIdx: 8, rate: 1.5, fullBar: 150, isPricedBar: 1 },
  { fromLabel: "Starter 3", toLabel: "Starter 4", fromTier: "Starter", fromLvl: 3, toTier: "Starter", toLvl: 4, fromIdx: 8, toIdx: 9, rate: 1.75, fullBar: 175, isPricedBar: 1 },
  { fromLabel: "Starter 4", toLabel: "Starter 5", fromTier: "Starter", fromLvl: 4, toTier: "Starter", toLvl: 5, fromIdx: 9, toIdx: 10, rate: 1.85, fullBar: 185, isPricedBar: 1 },
  { fromLabel: "Starter 5", toLabel: "Veteran 1", fromTier: "Starter", fromLvl: 5, toTier: "Veteran", toLvl: 1, fromIdx: 10, toIdx: 11, rate: 2.15, fullBar: 215, isPricedBar: 1 },
  { fromLabel: "Veteran 1", toLabel: "Veteran 2", fromTier: "Veteran", fromLvl: 1, toTier: "Veteran", toLvl: 2, fromIdx: 11, toIdx: 12, rate: 2.25, fullBar: 225, isPricedBar: 1 },
  { fromLabel: "Veteran 2", toLabel: "Veteran 3", fromTier: "Veteran", fromLvl: 2, toTier: "Veteran", toLvl: 3, fromIdx: 12, toIdx: 13, rate: 2.5, fullBar: 250, isPricedBar: 1 },
  { fromLabel: "Veteran 3", toLabel: "Veteran 4", fromTier: "Veteran", fromLvl: 3, toTier: "Veteran", toLvl: 4, fromIdx: 13, toIdx: 14, rate: 2.75, fullBar: 275, isPricedBar: 1 },
  { fromLabel: "Veteran 4", toLabel: "Veteran 5", fromTier: "Veteran", fromLvl: 4, toTier: "Veteran", toLvl: 5, fromIdx: 14, toIdx: 15, rate: 2.5, fullBar: 250, isPricedBar: 1 },
  { fromLabel: "Veteran 5", toLabel: "Legend 1", fromTier: "Veteran", fromLvl: 5, toTier: "Legend", toLvl: 1, fromIdx: 15, toIdx: 16, rate: 2.5, fullBar: 250, isPricedBar: 1 },
  { fromLabel: "Legend 1", toLabel: "Legend 2", fromTier: "Legend", fromLvl: 1, toTier: "Legend", toLvl: 2, fromIdx: 16, toIdx: 17, rate: 4.5, fullBar: 450, isPricedBar: 1 },
  { fromLabel: "Legend 2", toLabel: "Legend 3", fromTier: "Legend", fromLvl: 2, toTier: "Legend", toLvl: 3, fromIdx: 17, toIdx: 18, rate: 5, fullBar: 500, isPricedBar: 1 },
  { fromLabel: "Legend 3", toLabel: "Legend 4", fromTier: "Legend", fromLvl: 3, toTier: "Legend", toLvl: 4, fromIdx: 18, toIdx: 19, rate: 5.25, fullBar: 525, isPricedBar: 1 },
  { fromLabel: "Legend 4", toLabel: "Legend 5", fromTier: "Legend", fromLvl: 4, toTier: "Legend", toLvl: 5, fromIdx: 19, toIdx: 20, rate: 5.25, fullBar: 525, isPricedBar: 1 },
];

/** Late efficiency: Start Level (1-5) -> Surcharge % */
export const LATE_EFFICIENCY_SURCHARGE: Record<number, number> = {
  1: 0.005, 2: 0.01, 3: 0.03, 4: 0.05, 5: 0.07,
};
/** Tier -> factor for late efficiency */
export const LATE_EFFICIENCY_TIER_FACTOR: Record<string, number> = {
  Rookie: 0.6, Starter: 1, Veteran: 0.8, Legend: 0.7,
};
/** Bars touched -> volume multiplier */
export function getVolumeMultiplier(bars: number): number {
  if (bars <= 0) return 1;
  if (bars === 1) return 1;
  if (bars === 2) return 1.02;
  if (bars === 3) return 1.08;
  if (bars <= 5) return 1.12;
  return 1.14;
}
/** AI offer band -> multiplier */
export const AI_OFFER_MULTIPLIER: Record<string, number> = {
  Low: 0.95, Mid: 1, High: 1.05,
};

export interface RepDeliveryRow {
  from: string;
  to: string;
  minDays: number;
  maxDays: number;
}

export const REP_DELIVERY: RepDeliveryRow[] = [
  { from: "Rookie 1", to: "Rookie 2", minDays: 0.23, maxDays: 0.37 },
  { from: "Rookie 2", to: "Rookie 3", minDays: 0.23, maxDays: 0.37 },
  { from: "Rookie 3", to: "Rookie 4", minDays: 0.23, maxDays: 0.37 },
  { from: "Rookie 4", to: "Rookie 5", minDays: 0.23, maxDays: 0.37 },
  { from: "Rookie 5", to: "Starter 1", minDays: 0.23, maxDays: 0.37 },
  { from: "Starter 1", to: "Starter 2", minDays: 1.14, maxDays: 1.85 },
  { from: "Starter 2", to: "Starter 3", minDays: 1.14, maxDays: 1.85 },
  { from: "Starter 3", to: "Starter 4", minDays: 1.14, maxDays: 2.78 },
  { from: "Starter 4", to: "Starter 5", minDays: 2.27, maxDays: 3.7 },
  { from: "Starter 5", to: "Veteran 1", minDays: 3.41, maxDays: 4.6 },
  { from: "Veteran 1", to: "Veteran 2", minDays: 3.41, maxDays: 5.4 },
  { from: "Veteran 2", to: "Veteran 3", minDays: 3.4, maxDays: 4.9 },
  { from: "Veteran 3", to: "Veteran 4", minDays: 4.2, maxDays: 6 },
  { from: "Veteran 4", to: "Veteran 5", minDays: 8.31, maxDays: 11.32 },
  { from: "Veteran 5", to: "Legend 1", minDays: 5.99, maxDays: 10 },
  { from: "Legend 1", to: "Legend 2", minDays: 5.5, maxDays: 7 },
  { from: "Legend 2", to: "Legend 3", minDays: 6, maxDays: 8 },
  { from: "Legend 3", to: "Legend 4", minDays: 13.4, maxDays: 14.8 },
  { from: "Legend 4", to: "Legend 5", minDays: 14.56, maxDays: 15.76 },
];

/** Creator code -> discount (0-1, e.g. 0.15 = 15%) */
export const CREATORS_DISCOUNTS: Record<string, number> = {
  BUBS: 0.05, BULLET: 0.15, CHAD: 0.15, CHOC: 0.15, DIMEZ: 0.1, FAB: 0.15, FANTA: 0.15,
  GLIZZ: 0.05, GREENS: 0.05, HOMIEKIRK: 0.05, HUVZY: 0.05, IGYMO: 0.15, JACK3SONLY: 0.05,
  JBOOLIN: 0.05, JT2K: 0.05, KRAB: 0.05, METERMANLOS: 0.05, MISS: 0.05, NOTRAVELCALLS: 0.05,
  PARIS: 0.05, QUAVO: 0.15, RAYCAP: 0.05, SHIFTY: 0.05, SIBA: 0.1, SLUMP: 0.1,
  THE2KTWINS: 0.05, TJACK: 0.05, TRAVEL: 0.05, TRENT: 0.1, TUTAK: 0.05, TY: 0.05,
};

/** Market value table (same segments, different rates for "market" quote) */
export const REP_MARKET_VALUE = [
  { fromLabel: "Rookie 1", toLabel: "Rookie 2", fromIdx: 1, toIdx: 2, fullBar: 30, rate: 0.3, isPricedBar: 1 },
  { fromLabel: "Rookie 2", toLabel: "Rookie 3", fromIdx: 2, toIdx: 3, fullBar: 30, rate: 0.3, isPricedBar: 1 },
  { fromLabel: "Rookie 3", toLabel: "Rookie 4", fromIdx: 3, toIdx: 4, fullBar: 30, rate: 0.3, isPricedBar: 1 },
  { fromLabel: "Rookie 4", toLabel: "Rookie 5", fromIdx: 4, toIdx: 5, fullBar: 30, rate: 0.3, isPricedBar: 1 },
  { fromLabel: "Rookie 5", toLabel: "Starter 1", fromIdx: 5, toIdx: 6, fullBar: 30, rate: 0.3, isPricedBar: 1 },
  { fromLabel: "Starter 1", toLabel: "Starter 2", fromIdx: 6, toIdx: 7, fullBar: 100, rate: 1, isPricedBar: 1 },
  { fromLabel: "Starter 2", toLabel: "Starter 3", fromIdx: 7, toIdx: 8, fullBar: 100, rate: 1, isPricedBar: 1 },
  { fromLabel: "Starter 3", toLabel: "Starter 4", fromIdx: 8, toIdx: 9, fullBar: 150, rate: 1.5, isPricedBar: 1 },
  { fromLabel: "Starter 4", toLabel: "Starter 5", fromIdx: 9, toIdx: 10, fullBar: 150, rate: 1.5, isPricedBar: 1 },
  { fromLabel: "Starter 5", toLabel: "Veteran 1", fromIdx: 10, toIdx: 11, fullBar: 200, rate: 2, isPricedBar: 1 },
  { fromLabel: "Veteran 1", toLabel: "Veteran 2", fromIdx: 11, toIdx: 12, fullBar: 200, rate: 2, isPricedBar: 1 },
  { fromLabel: "Veteran 2", toLabel: "Veteran 3", fromIdx: 12, toIdx: 13, fullBar: 200, rate: 2, isPricedBar: 1 },
  { fromLabel: "Veteran 3", toLabel: "Veteran 4", fromIdx: 13, toIdx: 14, fullBar: 250, rate: 2.5, isPricedBar: 1 },
  { fromLabel: "Veteran 4", toLabel: "Veteran 5", fromIdx: 14, toIdx: 15, fullBar: 250, rate: 2.5, isPricedBar: 1 },
  { fromLabel: "Veteran 5", toLabel: "Legend 1", fromIdx: 15, toIdx: 16, fullBar: 250, rate: 2.5, isPricedBar: 1 },
  { fromLabel: "Legend 1", toLabel: "Legend 2", fromIdx: 16, toIdx: 17, fullBar: 300, rate: 3, isPricedBar: 1 },
  { fromLabel: "Legend 2", toLabel: "Legend 3", fromIdx: 17, toIdx: 18, fullBar: 300, rate: 3, isPricedBar: 1 },
  { fromLabel: "Legend 3", toLabel: "Legend 4", fromIdx: 18, toIdx: 19, fullBar: 300, rate: 3, isPricedBar: 1 },
  { fromLabel: "Legend 4", toLabel: "Legend 5", fromIdx: 19, toIdx: 20, fullBar: 300, rate: 3, isPricedBar: 1 },
];

export const TIER_END_IDX: Record<string, number> = {
  Rookie: 5, Starter: 10, Veteran: 15, Legend: 20,
};

export const TIERS = ["Rookie", "Starter", "Veteran", "Legend"] as const;
export const URGENCY_OPTIONS = ["Rush", "Normal", "Slow"] as const;
export const ROUND_BY = 5;
