/**
 * Editable Hot Zones quote settings (stored in DB, merged with defaults when missing).
 * Used by quote generator Hot Zones tab and admin UI.
 */

const DEFAULT_URGENCY_DELIVERY_FACTORS: Record<string, { min: number; max: number }> = {
  Rush: { min: 0.8, max: 0.75 },
  Normal: { min: 1, max: 1 },
  Slow: { min: 1.15, max: 1.2 },
};

/** Zone ids in display order (mid-range then 3PT). */
export const HOT_ZONE_IDS_ORDER = [
  "midrange-left",
  "midrange-left-center",
  "midrange-center",
  "midrange-right-center",
  "midrange-right",
  "3pt-left",
  "3pt-left-center",
  "3pt-center",
  "3pt-right-center",
  "3pt-right",
] as const;

export type HotZoneId = (typeof HOT_ZONE_IDS_ORDER)[number];

export interface HotZonesQuoteSettings {
  /** Price per zone (zone id -> $). Zones not listed use default price by category. */
  zonePricing: Record<string, number>;
  /** Default $ for mid-range zones when not in zonePricing. */
  defaultMidRangePrice: number;
  /** Default $ for 3PT zones when not in zonePricing. */
  default3ptPrice: number;
  /** Base delivery days (min/max) before urgency factor. */
  baseMinDays: number;
  baseMaxDays: number;
  /** Round quote total to nearest $X. */
  roundBy: number;
  /** Urgency → delivery factor (min/max multiplier). */
  urgencyDeliveryFactors: Record<string, { min: number; max: number }>;
  /** Company / grinder profit split (0–100). When null, use global Quote Generator split. */
  companyPct: number | null;
  grinderPct: number | null;
}

export function getDefaultHotZonesQuoteSettings(): HotZonesQuoteSettings {
  const zonePricing: Record<string, number> = {};
  for (const id of HOT_ZONE_IDS_ORDER) {
    zonePricing[id] = id.startsWith("3pt") ? 35 : 25;
  }
  return {
    zonePricing,
    defaultMidRangePrice: 25,
    default3ptPrice: 35,
    baseMinDays: 3,
    baseMaxDays: 7,
    roundBy: 5,
    urgencyDeliveryFactors: JSON.parse(JSON.stringify(DEFAULT_URGENCY_DELIVERY_FACTORS)),
    companyPct: null,
    grinderPct: null,
  };
}

/** Merge saved settings with defaults (saved wins, then default). */
export function mergeHotZonesQuoteSettings(
  saved: Partial<HotZonesQuoteSettings> | null | undefined
): HotZonesQuoteSettings {
  const def = getDefaultHotZonesQuoteSettings();
  if (!saved || typeof saved !== "object") return def;
  return {
    zonePricing:
      saved.zonePricing && typeof saved.zonePricing === "object"
        ? { ...def.zonePricing, ...saved.zonePricing }
        : def.zonePricing,
    defaultMidRangePrice:
      typeof saved.defaultMidRangePrice === "number" ? saved.defaultMidRangePrice : def.defaultMidRangePrice,
    default3ptPrice: typeof saved.default3ptPrice === "number" ? saved.default3ptPrice : def.default3ptPrice,
    baseMinDays: typeof saved.baseMinDays === "number" ? saved.baseMinDays : def.baseMinDays,
    baseMaxDays: typeof saved.baseMaxDays === "number" ? saved.baseMaxDays : def.baseMaxDays,
    roundBy: typeof saved.roundBy === "number" ? saved.roundBy : def.roundBy,
    urgencyDeliveryFactors:
      saved.urgencyDeliveryFactors && typeof saved.urgencyDeliveryFactors === "object"
        ? { ...def.urgencyDeliveryFactors, ...saved.urgencyDeliveryFactors }
        : def.urgencyDeliveryFactors,
    companyPct: saved.companyPct !== undefined ? saved.companyPct : def.companyPct,
    grinderPct: saved.grinderPct !== undefined ? saved.grinderPct : def.grinderPct,
  };
}

/** Get price for a zone from settings (zonePricing or category default). */
export function getHotZonePrice(settings: HotZonesQuoteSettings, zoneId: string): number {
  if (settings.zonePricing[zoneId] != null) return settings.zonePricing[zoneId];
  return zoneId.startsWith("3pt") ? settings.default3ptPrice : settings.defaultMidRangePrice;
}

/** Compute delivery min/max and timeframe text from settings and urgency. */
export function getHotZonesDelivery(
  settings: HotZonesQuoteSettings,
  urgency: string
): { minDays: number; maxDays: number; timeframeText: string } {
  const factor = settings.urgencyDeliveryFactors[urgency] ?? { min: 1, max: 1 };
  const minDays = Math.max(1, Math.round(settings.baseMinDays * factor.min));
  const maxDays = Math.max(minDays, Math.round(settings.baseMaxDays * factor.max));
  const timeframeText =
    minDays === maxDays
      ? `${minDays} day${minDays === 1 ? "" : "s"}`
      : `${minDays}–${maxDays} days`;
  return { minDays, maxDays, timeframeText };
}
