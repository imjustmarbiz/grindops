/**
 * Editable badge quote settings (stored in DB, merged with defaults when missing).
 * Used by badge quote generator calc and admin UI.
 */
import { ALL_BADGES } from "./badge-data";

const DEFAULT_URGENCY_QUOTE_MULTIPLIERS: Record<string, number> = {
  Rush: 1.05,
  Normal: 1,
  Slow: 0.95,
};
const DEFAULT_URGENCY_DELIVERY_FACTORS: Record<string, { min: number; max: number }> = {
  Rush: { min: 0.8, max: 0.75 },
  Normal: { min: 1, max: 1 },
  Slow: { min: 1.15, max: 1.2 },
};

export interface BadgeQuoteSettings {
  roundBy: number;
  /** Optional. When set, Badge tab uses this Company % instead of global. 0-100. */
  companyPct: number | null;
  /** Optional. When set, Badge tab uses this Grinder % instead of global. 0-100. */
  grinderPct: number | null;
  urgencyQuoteMultipliers: Record<string, number>;
  urgencyDeliveryFactors: Record<string, { min: number; max: number }>;
  /** Price per badge (badge id -> $). Badges not listed use defaultBadgePrice. */
  badgePricing: Record<string, number>;
  /** Default $ per badge when not in badgePricing. */
  defaultBadgePrice: number;
  /** Max total $ for badges before urgency/discount (null = no cap). */
  maxBadgesPrice: number | null;
  /** Base delivery days (min/max). */
  baseMinDays: number;
  baseMaxDays: number;
}

const ROUND_BY = 5;

function defaultBadgePricing(): Record<string, number> {
  const m: Record<string, number> = {};
  for (const b of ALL_BADGES) {
    m[b.id] = 15; // default $15 per badge
  }
  return m;
}

export function getDefaultBadgeQuoteSettings(): BadgeQuoteSettings {
  return {
    roundBy: ROUND_BY,
    companyPct: null,
    grinderPct: null,
    urgencyQuoteMultipliers: { ...DEFAULT_URGENCY_QUOTE_MULTIPLIERS },
    urgencyDeliveryFactors: JSON.parse(JSON.stringify(DEFAULT_URGENCY_DELIVERY_FACTORS)),
    badgePricing: defaultBadgePricing(),
    defaultBadgePrice: 15,
    maxBadgesPrice: 500,
    baseMinDays: 1,
    baseMaxDays: 7,
  };
}

/** Merge saved settings with defaults (saved wins, then default). */
export function mergeBadgeQuoteSettings(saved: Partial<BadgeQuoteSettings> | null | undefined): BadgeQuoteSettings {
  const def = getDefaultBadgeQuoteSettings();
  if (!saved || typeof saved !== "object") return def;
  const parsePct = (v: unknown): number | null => {
    if (v == null) return null;
    if (typeof v === "number" && !Number.isNaN(v) && v >= 0 && v <= 100) return v;
    if (typeof v === "string") { const n = parseFloat(v); return !Number.isNaN(n) && n >= 0 && n <= 100 ? n : null; }
    return null;
  };
  return {
    roundBy: typeof saved.roundBy === "number" ? saved.roundBy : def.roundBy,
    companyPct: saved.companyPct !== undefined ? parsePct(saved.companyPct) : def.companyPct,
    grinderPct: saved.grinderPct !== undefined ? parsePct(saved.grinderPct) : def.grinderPct,
    urgencyQuoteMultipliers:
      saved.urgencyQuoteMultipliers && typeof saved.urgencyQuoteMultipliers === "object"
        ? { ...def.urgencyQuoteMultipliers, ...saved.urgencyQuoteMultipliers }
        : def.urgencyQuoteMultipliers,
    urgencyDeliveryFactors:
      saved.urgencyDeliveryFactors && typeof saved.urgencyDeliveryFactors === "object"
        ? { ...def.urgencyDeliveryFactors, ...saved.urgencyDeliveryFactors }
        : def.urgencyDeliveryFactors,
    badgePricing:
      saved.badgePricing && typeof saved.badgePricing === "object"
        ? { ...def.badgePricing, ...saved.badgePricing }
        : def.badgePricing,
    defaultBadgePrice: typeof saved.defaultBadgePrice === "number" ? saved.defaultBadgePrice : def.defaultBadgePrice,
    maxBadgesPrice: saved.maxBadgesPrice !== undefined && saved.maxBadgesPrice !== null ? saved.maxBadgesPrice : def.maxBadgesPrice,
    baseMinDays: typeof saved.baseMinDays === "number" ? saved.baseMinDays : def.baseMinDays,
    baseMaxDays: typeof saved.baseMaxDays === "number" ? saved.baseMaxDays : def.baseMaxDays,
  };
}
