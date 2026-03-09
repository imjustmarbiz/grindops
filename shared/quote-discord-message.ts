/**
 * Builds a Discord-style message for sharing a quote with a customer.
 * Customer sees ONE final price and the estimated order timeline only.
 */
export const URGENCY_LABELS: Record<string, string> = {
  Rush: "Rush",
  Normal: "Normal",
  Slow: "No Rush",
};

function formatRepWithPct(tier: string, lvl: string | number, pct: number | undefined | null): string {
  const p = pct != null ? Number(pct) : 0;
  if (!Number.isNaN(p) && p !== 0) {
    return `${tier} ${lvl} (${p}%)`;
  }
  return `${tier} ${lvl}`;
}

export interface QuoteDiscordOptions {
  customerPrice: number;
  estimatedTimeframe: string;
  /** Override the quote header (e.g. "Badge Grinding Quote"). Default "Rep Grinding Quote". */
  serviceLabel?: string;
  /** Days format (e.g. "6-8 Days"). When different from estimatedTimeframe, shown first with alternative in parens. */
  timeframeText?: string;
  customerIdentifier?: string | null;
  route: string;
  urgency: string;
  creatorCode?: string | null;
  /** When provided, route is built with start/target % (omit 0%) */
  startTier?: string;
  startLvl?: string | number;
  startPct?: number | null;
  targetTier?: string;
  targetLvl?: string | number;
  targetPct?: number | null;
  /** Original price before discount (shown when discount > 0). If omitted but discountPercent provided, derived from customerPrice. */
  originalPrice?: number;
  /** Discount percentage 0–100. When > 0, shows original price and discount lines. */
  discountPercent?: number;
}

export function buildQuoteDiscordMessage(options: QuoteDiscordOptions): string {
  const { customerPrice, estimatedTimeframe, timeframeText, customerIdentifier, route, urgency, creatorCode, startTier, startLvl, startPct, targetTier, targetLvl, targetPct, originalPrice, discountPercent, serviceLabel } = options;

  const displayTimeframe =
    timeframeText && timeframeText !== estimatedTimeframe
      ? `${timeframeText} (${estimatedTimeframe})`
      : estimatedTimeframe;

  const hasRouteParts =
    startTier != null && startLvl != null && targetTier != null && targetLvl != null;

  const displayRoute = hasRouteParts
    ? `${formatRepWithPct(String(startTier), startLvl, startPct)} → ${formatRepWithPct(String(targetTier), targetLvl, targetPct)}`
    : route;

  const lines: string[] = [];
  lines.push(`**📋 ${serviceLabel ?? "Rep Grinding Quote"}**`);
  lines.push("");
  if (customerIdentifier) {
    lines.push(`*Customer:* ${customerIdentifier}`);
    lines.push("");
  }
  lines.push(`**Route:** ${displayRoute}`);
  lines.push(`**Urgency:** ${URGENCY_LABELS[urgency] ?? urgency}`);
  if (creatorCode) {
    lines.push(`**Creator Code:** ${creatorCode}`);
  }
  lines.push("");
  lines.push("```");
  const pct = discountPercent != null ? Number(discountPercent) : 0;
  const hasDiscount = !Number.isNaN(pct) && pct > 0;
  const orig = originalPrice != null ? Number(originalPrice) : (hasDiscount && pct < 100 ? customerPrice / (1 - pct / 100) : undefined);
  if (hasDiscount && orig != null && orig > customerPrice) {
    lines.push(`Original price: $${Math.round(orig).toLocaleString()}`);
    lines.push(`Discount: ${pct.toFixed(0)}%`);
  }
  lines.push(`Your quote:  $${customerPrice.toLocaleString()}`);
  lines.push(`Estimated timeframe: ${displayTimeframe}`);
  lines.push("```");

  return lines.join("\n");
}

/** Format route from quote inputs (same format as Discord message; omit 0%). */
export function formatQuoteRoute(inputs: {
  startTier?: string | null;
  startLvl?: string | number | null;
  startPct?: number | null;
  targetTier?: string | null;
  targetLvl?: string | number | null;
  targetPct?: number | null;
} | null | undefined): string {
  if (!inputs?.startTier || inputs.startLvl == null || !inputs.targetTier || inputs.targetLvl == null) return "—";
  return `${formatRepWithPct(inputs.startTier, inputs.startLvl, inputs.startPct)} → ${formatRepWithPct(inputs.targetTier, inputs.targetLvl, inputs.targetPct)}`;
}
