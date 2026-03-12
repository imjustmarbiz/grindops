/**
 * Badge Quote Generator calculation logic.
 * Supports optional BadgeQuoteSettings and MyPlayerTypeSettings for editable admin config.
 */
import { mergeBadgeQuoteSettings, type BadgeQuoteSettings } from "./badge-quote-settings";
import { mergeMyPlayerTypeSettings, type MyPlayerTypeSettings } from "./my-player-type-settings";
import type { MyPlayerType } from "./my-player-type-settings";

export interface BadgeQuoteInputs {
  badgeIds: string[];
  urgency: "Rush" | "Normal" | "Slow";
  discountPct: number;
  creatorCode: string;
  creatorDiscountPercent?: number;
  defaultCompanyPct?: number;
  defaultGrinderPct?: number;
  roundedBy: number;
  chosenFinalQuote: number;
  grinderBid: number;
  /** MyPlayer Type: Non-Rebirth and Rebirth both add to cost. */
  myPlayerType?: MyPlayerType;
}

export interface BadgeQuoteResults {
  baseCost: number;
  urgencyMultiplier: number;
  afterUrgency: number;
  discountUsed: number;
  creatorDiscount: number;
  afterDiscount: number;
  roundedQuote: number;
  recommendedQuote: number;
  companyPayout: number;
  grinderPayout: number;
  creatorCommission: number;
  companyPct: number;
  grinderPct: number;
  creatorPct: number;
  profitMargin: "GREEN" | "YELLOW" | "RED" | null;
  grinderBidAboveDefault: boolean;
  minDays: number;
  maxDays: number;
  timeframeText: string;
  badgeBreakdown: Array<{ badgeId: string; badgeName: string; price: number }>;
}

function roundTo(value: number, roundBy: number): number {
  if (roundBy <= 0) return Math.round(value);
  return Math.round(value / roundBy) * roundBy;
}

export function calculateBadgeQuote(
  inputs: BadgeQuoteInputs,
  settings?: BadgeQuoteSettings | null,
  myPlayerTypeSettings?: MyPlayerTypeSettings | null
): BadgeQuoteResults {
  const s = settings ? mergeBadgeQuoteSettings(settings) : mergeBadgeQuoteSettings(null);
  const mpt = mergeMyPlayerTypeSettings(myPlayerTypeSettings ?? null);

  const defaultCompanyPct = Math.max(0, Math.min(1, inputs.defaultCompanyPct ?? 0.7));
  const defaultGrinderPct = Math.max(0, Math.min(1, inputs.defaultGrinderPct ?? 0.3));

  const roundBy = inputs.roundedBy > 0 ? inputs.roundedBy : s.roundBy;

  const urgencyMult = s.urgencyQuoteMultipliers[inputs.urgency] ?? 1;
  const deliveryFactor = s.urgencyDeliveryFactors[inputs.urgency] ?? { min: 1, max: 1 };

  const badgeBreakdown: Array<{ badgeId: string; badgeName: string; price: number }> = [];
  let baseCost = 0;
  for (const id of inputs.badgeIds) {
    const price = s.badgePricing[id] ?? s.defaultBadgePrice;
    baseCost += price;
    badgeBreakdown.push({ badgeId: id, badgeName: formatBadgeName(id), price });
  }

  if (s.maxBadgesPrice != null && baseCost > s.maxBadgesPrice) {
    baseCost = s.maxBadgesPrice;
  }

  // MyPlayer Type adjustment (Badge Grinding only)
  if (inputs.myPlayerType) {
    if (inputs.myPlayerType === "Non-Rebirth") baseCost += mpt.nonRebirthAdd;
    else if (inputs.myPlayerType === "Rebirth") baseCost += mpt.rebirthAdd;
  }

  const afterUrgency = baseCost * urgencyMult;
  const discountUsed = Math.min(inputs.discountPct / 100, 0.5);
  const creatorDiscount = inputs.creatorDiscountPercent ?? 0;
  const totalDiscount = Math.min(discountUsed + creatorDiscount, 0.5);
  const afterDiscount = afterUrgency * (1 - totalDiscount);
  const roundedQuote = roundTo(afterDiscount, roundBy);

  const chosenQuote = inputs.chosenFinalQuote > 0 ? inputs.chosenFinalQuote : roundedQuote;
  const grinderBid = inputs.grinderBid;
  const grinderBidAboveDefault = grinderBid > 0 && grinderBid / chosenQuote > defaultGrinderPct;

  let companyPct: number;
  let grinderPct: number;
  let creatorPct: number;
  if (grinderBid > 0 && grinderBid < chosenQuote) {
    companyPct = (chosenQuote - grinderBid) / chosenQuote;
    grinderPct = grinderBid / chosenQuote;
    creatorPct = 0;
  } else {
    companyPct = defaultCompanyPct;
    grinderPct = defaultGrinderPct;
    creatorPct = 0;
  }
  if (inputs.creatorCode && creatorDiscount > 0) {
    creatorPct = creatorDiscount;
    companyPct = companyPct - creatorPct;
  }

  const companyPayout = chosenQuote * companyPct;
  const grinderPayout = chosenQuote * grinderPct;
  const creatorCommission = chosenQuote * creatorPct;

  const margin = companyPct;
  let profitMargin: "GREEN" | "YELLOW" | "RED" | null = null;
  if (margin >= 0.5) profitMargin = "GREEN";
  else if (margin >= 0.3) profitMargin = "YELLOW";
  else if (margin >= 0) profitMargin = "RED";

  const minDays = Math.max(1, Math.round(s.baseMinDays * deliveryFactor.min));
  const maxDays = Math.max(minDays, Math.round(s.baseMaxDays * deliveryFactor.max));
  const timeframeText = `${minDays}–${maxDays} days`;

  return {
    baseCost,
    urgencyMultiplier: urgencyMult,
    afterUrgency,
    discountUsed,
    creatorDiscount,
    afterDiscount,
    roundedQuote,
    recommendedQuote: roundedQuote,
    companyPayout,
    grinderPayout,
    creatorCommission,
    companyPct,
    grinderPct,
    creatorPct,
    profitMargin,
    grinderBidAboveDefault,
    minDays,
    maxDays,
    timeframeText,
    badgeBreakdown,
  };
}

function formatBadgeName(id: string): string {
  return id
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
