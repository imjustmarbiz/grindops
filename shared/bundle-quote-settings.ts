/**
 * Bundle tab quote settings (stored in queue_config.bundle_quote_settings).
 * Used to round the combined Rep + Badge total on the Quote Generator bundle tab.
 */
export interface BundleQuoteSettings {
  /** Round combined bundle total to nearest $X (e.g. 5 → $125, $130). 0 = no extra rounding. */
  roundBy: number;
  /** Optional. When set, Bundle tab uses this Company % instead of global. 0-100. */
  companyPct: number | null;
  /** Optional. When set, Bundle tab uses this Grinder % instead of global. 0-100. */
  grinderPct: number | null;
}

const DEFAULT_ROUND_BY = 5;

export function getDefaultBundleQuoteSettings(): BundleQuoteSettings {
  return { roundBy: DEFAULT_ROUND_BY, companyPct: null, grinderPct: null };
}

export function mergeBundleQuoteSettings(saved: Partial<BundleQuoteSettings> | null | undefined): BundleQuoteSettings {
  const def = getDefaultBundleQuoteSettings();
  if (!saved || typeof saved !== "object") return def;
  const parsePct = (v: unknown): number | null => {
    if (v == null) return null;
    if (typeof v === "number" && !Number.isNaN(v) && v >= 0 && v <= 100) return v;
    if (typeof v === "string") { const n = parseFloat(v); return !Number.isNaN(n) && n >= 0 && n <= 100 ? n : null; }
    return null;
  };
  const roundBy = typeof saved.roundBy === "number" && saved.roundBy >= 0 ? saved.roundBy : def.roundBy;
  const companyPct = saved.companyPct !== undefined ? parsePct(saved.companyPct) : def.companyPct;
  const grinderPct = saved.grinderPct !== undefined ? parsePct(saved.grinderPct) : def.grinderPct;
  return { roundBy, companyPct, grinderPct };
}
