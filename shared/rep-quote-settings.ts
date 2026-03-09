/**
 * Editable rep quote settings (stored in DB, merged with defaults when missing).
 * Used by quote generator calc and admin UI.
 */
import {
  REP_PRICING,
  REP_DELIVERY,
  REP_MARKET_VALUE,
  LATE_EFFICIENCY_SURCHARGE,
  LATE_EFFICIENCY_TIER_FACTOR,
  ROUND_BY,
  getVolumeMultiplier,
} from "./quote-generator-data";

const DEFAULT_URGENCY_QUOTE_MULTIPLIERS: Record<string, number> = {
  Rush: 1.05,
  Normal: 1,
  Slow: 0.95,
};
const DEFAULT_URGENCY_DELIVERY_FACTORS: Record<string, { min: number; max: number }> = {
  Rush: { min: 0.8, max: 0.75 },
  Extreme: { min: 0.7, max: 0.65 },
  Normal: { min: 1, max: 1 },
  Slow: { min: 1.15, max: 1.2 },
};

export interface RepPricingRowEditable {
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

export interface RepDeliveryRowEditable {
  from: string;
  to: string;
  minDays: number;
  maxDays: number;
}

export interface RepMarketValueRowEditable {
  fromLabel: string;
  toLabel: string;
  fromIdx: number;
  toIdx: number;
  fullBar: number;
  rate: number;
  isPricedBar: number;
}

/** Keys are stringified bar counts; "6" means 6+ bars */
export type VolumeMultiplierMap = Record<string, number>;

export interface RepQuoteSettings {
  roundBy: number;
  urgencyQuoteMultipliers: Record<string, number>;
  urgencyDeliveryFactors: Record<string, { min: number; max: number }>;
  /** Bars (1-5, 6 for 6+) -> multiplier */
  volumeMultiplierByBars: VolumeMultiplierMap;
  /** Start level 1-5 -> surcharge (e.g. 0.005 = 0.5%) */
  lateEfficiencySurcharge: Record<string, number>;
  /** Tier name -> factor */
  lateEfficiencyTierFactor: Record<string, number>;
  repPricing: RepPricingRowEditable[];
  repDelivery: RepDeliveryRowEditable[];
  repMarketValue: RepMarketValueRowEditable[];
}

function volumeMapFromFn(): VolumeMultiplierMap {
  const m: VolumeMultiplierMap = {};
  for (let b = 1; b <= 6; b++) {
    m[String(b)] = getVolumeMultiplier(b);
  }
  return m;
}

export function getDefaultRepQuoteSettings(): RepQuoteSettings {
  return {
    roundBy: ROUND_BY,
    urgencyQuoteMultipliers: { ...DEFAULT_URGENCY_QUOTE_MULTIPLIERS },
    urgencyDeliveryFactors: JSON.parse(JSON.stringify(DEFAULT_URGENCY_DELIVERY_FACTORS)),
    volumeMultiplierByBars: volumeMapFromFn(),
    lateEfficiencySurcharge: Object.fromEntries(
      Object.entries(LATE_EFFICIENCY_SURCHARGE).map(([k, v]) => [String(k), v])
    ),
    lateEfficiencyTierFactor: { ...LATE_EFFICIENCY_TIER_FACTOR },
    repPricing: REP_PRICING.map((r) => ({ ...r })),
    repDelivery: REP_DELIVERY.map((r) => ({ ...r })),
    repMarketValue: REP_MARKET_VALUE.map((r) => ({ ...r })),
  };
}

/** Merge saved settings with defaults (saved wins, then default). */
export function mergeRepQuoteSettings(saved: Partial<RepQuoteSettings> | null | undefined): RepQuoteSettings {
  const def = getDefaultRepQuoteSettings();
  if (!saved || typeof saved !== "object") return def;
  return {
    roundBy: typeof saved.roundBy === "number" ? saved.roundBy : def.roundBy,
    urgencyQuoteMultipliers: saved.urgencyQuoteMultipliers && typeof saved.urgencyQuoteMultipliers === "object"
      ? { ...def.urgencyQuoteMultipliers, ...saved.urgencyQuoteMultipliers }
      : def.urgencyQuoteMultipliers,
    urgencyDeliveryFactors: saved.urgencyDeliveryFactors && typeof saved.urgencyDeliveryFactors === "object"
      ? { ...def.urgencyDeliveryFactors, ...saved.urgencyDeliveryFactors }
      : def.urgencyDeliveryFactors,
    volumeMultiplierByBars: saved.volumeMultiplierByBars && typeof saved.volumeMultiplierByBars === "object"
      ? { ...def.volumeMultiplierByBars, ...saved.volumeMultiplierByBars }
      : def.volumeMultiplierByBars,
    lateEfficiencySurcharge: saved.lateEfficiencySurcharge && typeof saved.lateEfficiencySurcharge === "object"
      ? { ...def.lateEfficiencySurcharge, ...saved.lateEfficiencySurcharge }
      : def.lateEfficiencySurcharge,
    lateEfficiencyTierFactor: saved.lateEfficiencyTierFactor && typeof saved.lateEfficiencyTierFactor === "object"
      ? { ...def.lateEfficiencyTierFactor, ...saved.lateEfficiencyTierFactor }
      : def.lateEfficiencyTierFactor,
    repPricing: Array.isArray(saved.repPricing) && saved.repPricing.length > 0 ? saved.repPricing : def.repPricing,
    repDelivery: Array.isArray(saved.repDelivery) && saved.repDelivery.length > 0 ? saved.repDelivery : def.repDelivery,
    repMarketValue: Array.isArray(saved.repMarketValue) && saved.repMarketValue.length > 0 ? saved.repMarketValue : def.repMarketValue,
  };
}

/** Resolve volume multiplier from settings (bars 6+ use key "6"). */
export function getVolumeMultiplierFromSettings(settings: RepQuoteSettings, bars: number): number {
  if (bars <= 0) return 1;
  const key = bars >= 6 ? "6" : String(bars);
  return settings.volumeMultiplierByBars[key] ?? 1;
}
