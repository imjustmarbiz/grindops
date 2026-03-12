/**
 * Rep Quote Generator calculation logic (mirrors Excel formulas).
 * Supports optional RepQuoteSettings for editable admin config.
 */
import {
  REP_PRICING as DEFAULT_REP_PRICING,
  REP_MARKET_VALUE as DEFAULT_REP_MARKET_VALUE,
  REP_DELIVERY as DEFAULT_REP_DELIVERY,
  CREATORS_DISCOUNTS,
  getVolumeMultiplier as defaultGetVolumeMultiplier,
  LATE_EFFICIENCY_SURCHARGE as DEFAULT_LATE_EFFICIENCY_SURCHARGE,
  LATE_EFFICIENCY_TIER_FACTOR as DEFAULT_LATE_EFFICIENCY_TIER_FACTOR,
  TIER_END_IDX as DEFAULT_TIER_END_IDX,
  ROUND_BY,
} from "./quote-generator-data";
import type { RepPricingRowEditable, RepDeliveryRowEditable, RepMarketValueRowEditable } from "./rep-quote-settings";
import { mergeRepQuoteSettings, getVolumeMultiplierFromSettings, type RepQuoteSettings } from "./rep-quote-settings";

export interface QuoteInputs {
  startTier: string;
  startLvl: number;
  startPct: number;
  targetTier: string;
  targetLvl: number;
  targetPct: number;
  urgency: "Rush" | "Normal" | "Slow";
  discountPct: number;
  creatorCode: string;
  /** When set, used as the creator's commission % (0-1) instead of CREATORS_DISCOUNTS[creatorCode]. Allows admin-override per creator. */
  creatorDiscountPercent?: number;
  /** Default company share of quote when no grinder bid (0-1). Default 0.70. */
  defaultCompanyPct?: number;
  /** Default grinder share of quote when no grinder bid (0-1). Default 0.30. */
  defaultGrinderPct?: number;
  roundedBy: number;
  chosenFinalQuote: number;
  grinderBid: number;
}

export interface QuoteResults {
  startIdx: number;
  targetIdx: number;
  barsTouched: number;
  baseCostMarket: number;
  baseCostAI: number;
  volumeModifier: number;
  lateEfficiencyMultiplier: number;
  afterLateEffMarket: number;
  afterLateEffAI: number;
  marketQuote: number;
  aiSuggestedQuote: number;
  aiLowQuote: number;
  aiHighQuote: number;
  recommendedQuote: number;
  marketVsAiDiff: number;
  marketVsAiGrade: "STRONG" | "ACCEPTABLE" | "RISKY";
  discountUsed: number;
  creatorDiscount: number;
  companyPayout: number;
  grinderPayout: number;
  creatorCommission: number;
  companyPct: number;
  grinderPct: number;
  creatorPct: number;
  profitMargin: "GREEN" | "YELLOW" | "RED" | null;
  /** True when a grinder bid was entered and it is above the default grinder share (e.g. above 30%). */
  grinderBidAboveDefault: boolean;
  minDays: number;
  maxDays: number;
  timeframeText: string;
  estimatedTimeframe: string;
  /** Rep breakdown: FROM, TO, RATE, WEIGHT, LINE COST, EST. DAYS (LINE COST = Weight × Rate × 100; days = Weight × segment min/max) */
  repBreakdown: Array<{
    fromLabel: string;
    toLabel: string;
    rate: number;
    weight: number;
    lineCost: number;
    minDaysSeg: number;
    maxDaysSeg: number;
    weightedMinDays: number;
    weightedMaxDays: number;
    isActive: boolean;
  }>;
}

function deriveTierEndIdx(repPricing: RepPricingRowEditable[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of repPricing) {
    const tier = r.toTier;
    out[tier] = Math.max(out[tier] ?? 0, r.toIdx);
  }
  return out;
}

function getStartIdx(repPricing: RepPricingRowEditable[], startTier: string, startLvl: number): number {
  const label = `${startTier} ${startLvl}`;
  const i = repPricing.findIndex((r) => r.fromLabel === label);
  return i >= 0 ? repPricing[i].fromIdx : 0;
}

function getTargetIdx(repPricing: RepPricingRowEditable[], targetTier: string, targetLvl: number): number {
  const label = `${targetTier} ${targetLvl}`;
  const i = repPricing.findIndex((r) => r.toLabel === label);
  return i >= 0 ? repPricing[i].toIdx : 0;
}

/** Compute weight for segment i (0-based) for the given start/target indices and percentages */
function getSegmentWeight(
  segFromIdx: number,
  segToIdx: number,
  startIdx: number,
  targetIdx: number,
  startPct: number,
  targetPct: number,
  isPricedBar: number
): number {
  if (isPricedBar === 0) return 0;
  if (targetIdx < startIdx) return 0;
  if (startIdx === targetIdx) {
    if (segFromIdx === startIdx && segToIdx === targetIdx + 1) return Math.max(0, (targetPct - startPct) / 100);
    return 0;
  }
  if (segFromIdx === startIdx && segToIdx === startIdx + 1) return (100 - startPct) / 100;
  if (segFromIdx > startIdx && segToIdx <= targetIdx) return 1;
  if (segFromIdx === targetIdx && segToIdx === targetIdx + 1) return targetPct / 100;
  return 0;
}

function computeBaseCost(
  repPricing: RepPricingRowEditable[],
  repMarketValue: RepMarketValueRowEditable[],
  startIdx: number,
  targetIdx: number,
  startPct: number,
  targetPct: number,
  useMarket: boolean
): number {
  let sum = 0;
  for (let i = 0; i < repPricing.length; i++) {
    const row = repPricing[i];
    const w = getSegmentWeight(row.fromIdx, row.toIdx, startIdx, targetIdx, startPct, targetPct, row.isPricedBar);
    const rate = useMarket ? repMarketValue[i]?.rate ?? row.rate : row.rate;
    sum += w * (rate * 100);
  }
  return sum;
}

function computeCurrentRepTierCost(
  repPricing: RepPricingRowEditable[],
  tierEndIdx: Record<string, number>,
  startTier: string,
  startIdx: number,
  targetIdx: number,
  startPct: number,
  targetPct: number
): number {
  let sum = 0;
  const startTierEndIdx = tierEndIdx[startTier] ?? 20;
  for (let i = 0; i < repPricing.length; i++) {
    const r = repPricing[i];
    if (r.fromIdx < startIdx || r.fromIdx > startTierEndIdx) continue;
    const w = getSegmentWeight(r.fromIdx, r.toIdx, startIdx, targetIdx, startPct, targetPct, r.isPricedBar);
    sum += w * r.rate * 100;
  }
  return sum;
}

/** Urgency → quote price multiplier (Rush adds 5%, Slow subtracts 5%). Used for display in admin. */
export const URGENCY_QUOTE_MULTIPLIERS: Record<string, number> = {
  Rush: 1.05,
  Normal: 1,
  Slow: 0.95,
};

/** Urgency → delivery time factors (min/max multipliers for estimated days). Used for display in admin. */
export const URGENCY_DELIVERY_FACTORS: Record<string, { min: number; max: number }> = {
  Rush: { min: 0.8, max: 0.75 },
  Extreme: { min: 0.7, max: 0.65 },
  Normal: { min: 1, max: 1 },
  Slow: { min: 1.15, max: 1.2 },
};

export function calculateQuote(inputs: QuoteInputs, settings?: RepQuoteSettings | null): QuoteResults {
  const merged = settings ? mergeRepQuoteSettings(settings) : null;
  const repPricing = merged?.repPricing ?? (DEFAULT_REP_PRICING as RepPricingRowEditable[]);
  const repDelivery = merged?.repDelivery ?? (DEFAULT_REP_DELIVERY as RepDeliveryRowEditable[]);
  const repMarketValue = merged?.repMarketValue ?? (DEFAULT_REP_MARKET_VALUE as RepMarketValueRowEditable[]);
  const tierEndIdx = merged ? deriveTierEndIdx(repPricing) : DEFAULT_TIER_END_IDX;
  const getVolume = (bars: number) =>
    merged ? getVolumeMultiplierFromSettings(merged, bars) : defaultGetVolumeMultiplier(bars);
  const getLateSurcharge = (lvl: number) =>
    merged ? (merged.lateEfficiencySurcharge[String(lvl)] ?? 0) : (DEFAULT_LATE_EFFICIENCY_SURCHARGE[lvl] ?? 0);
  const getLateTierFactor = (tier: string) =>
    merged ? (merged.lateEfficiencyTierFactor[tier] ?? 1) : (DEFAULT_LATE_EFFICIENCY_TIER_FACTOR[tier] ?? 1);
  const getUrgencyDelivery = (urgency: string) =>
    merged ? (merged.urgencyDeliveryFactors[urgency] ?? { min: 1, max: 1 }) : URGENCY_DELIVERY_FACTORS[urgency] ?? { min: 1, max: 1 };
  const getUrgencyQuoteMult = (urgency: string) =>
    merged ? (merged.urgencyQuoteMultipliers[urgency] ?? 1) : URGENCY_QUOTE_MULTIPLIERS[urgency] ?? 1;
  const roundedBy = merged ? merged.roundBy : (inputs.roundedBy || ROUND_BY);

  const startIdx = getStartIdx(repPricing, inputs.startTier, inputs.startLvl);
  const targetIdx = getTargetIdx(repPricing, inputs.targetTier, inputs.targetLvl);
  const startPct = inputs.startPct;
  const targetPct = inputs.targetPct;

  const barsTouched = (() => {
    let sum = 0;
    for (let i = 0; i < repPricing.length; i++) {
      const r = repPricing[i];
      const w = getSegmentWeight(r.fromIdx, r.toIdx, startIdx, targetIdx, startPct, targetPct, r.isPricedBar);
      if (w > 0 && r.isPricedBar) sum += w;
    }
    return Math.max(0, Math.ceil(sum));
  })();

  const baseCostMarket = computeBaseCost(repPricing, repMarketValue, startIdx, targetIdx, startPct, targetPct, true);
  const baseCostAI = computeBaseCost(repPricing, repMarketValue, startIdx, targetIdx, startPct, targetPct, false);
  const volumeModifier = getVolume(barsTouched);
  const surcharge = getLateSurcharge(inputs.startLvl);
  const tierFactor = getLateTierFactor(inputs.startTier);
  const lateEfficiencyMultiplier = 1 + surcharge * tierFactor;
  const currentRepTierCost = computeCurrentRepTierCost(
    repPricing,
    tierEndIdx,
    inputs.startTier,
    startIdx,
    targetIdx,
    startPct,
    targetPct
  );
  const afterLateEffMarket =
    baseCostMarket * volumeModifier - currentRepTierCost * (1 - lateEfficiencyMultiplier);
  const afterLateEffAI =
    baseCostAI * volumeModifier - currentRepTierCost * (1 - lateEfficiencyMultiplier);

  const creatorDiscount =
    inputs.creatorCode
      ? (inputs.creatorDiscountPercent ?? (CREATORS_DISCOUNTS[inputs.creatorCode.toUpperCase()] ?? 0))
      : 0;
  const discountUsed = Math.max(creatorDiscount, inputs.discountPct / 100);

  const marketQuoteRaw = Math.max(0, afterLateEffMarket * (1 - discountUsed));
  const aiMidRaw = Math.max(0, afterLateEffAI * (1 - discountUsed));
  const urgencyMult = getUrgencyQuoteMult(inputs.urgency);
  const aiSuggestedRaw = aiMidRaw * urgencyMult;

  const round = (x: number) => (roundedBy > 0 ? Math.round(x / roundedBy) * roundedBy : x);
  const marketQuote = round(marketQuoteRaw);
  const aiSuggestedQuote = round(aiSuggestedRaw);
  const aiLowQuote = round(aiMidRaw * 0.95);
  const aiHighQuote = round(aiMidRaw * 1.05);

  const marketVsAiDiff =
    marketQuote > 0 ? (aiSuggestedQuote - marketQuote) / marketQuote : 0;
  const marketVsAiGrade: "STRONG" | "ACCEPTABLE" | "RISKY" =
    Math.abs(marketVsAiDiff) <= 0.05 ? "STRONG" : Math.abs(marketVsAiDiff) <= 0.15 ? "ACCEPTABLE" : "RISKY";
  const recommendedQuote = Math.abs(marketVsAiDiff) > 0.1 ? marketQuote : aiSuggestedQuote;

  const chosen = inputs.chosenFinalQuote || recommendedQuote;
  const grinderBid = inputs.grinderBid || 0;
  const defaultCompany = Math.max(0, Math.min(1, inputs.defaultCompanyPct ?? 0.70));
  const defaultGrinder = Math.max(0, Math.min(1, inputs.defaultGrinderPct ?? 0.30));
  const normGrinderShare = defaultGrinder;

  let companyGross: number;
  let grinderPayout: number;
  if (grinderBid > 0) {
    grinderPayout = grinderBid;
    companyGross = Math.max(0, chosen - grinderBid);
  } else {
    grinderPayout = chosen * defaultGrinder;
    companyGross = chosen * defaultCompany;
  }

  const grinderBidAboveDefault = grinderBid > 0 && chosen > 0 && grinderBid > chosen * normGrinderShare;

  const creatorCommission = inputs.creatorCode && creatorDiscount > 0
    ? companyGross * creatorDiscount
    : 0;
  const companyPayout = Math.max(0, companyGross - creatorCommission);

  const companyPct = chosen > 0 ? companyPayout / chosen : 0;
  const grinderPct = chosen > 0 ? grinderPayout / chosen : 0;
  const creatorPct = chosen > 0 ? creatorCommission / chosen : 0;

  let profitMargin: "GREEN" | "YELLOW" | "RED" | null = null;
  if (chosen > 0) {
    const companyShare = companyPayout / chosen;
    if (companyShare < 0.3) profitMargin = "RED";
    else if (companyShare < 0.4) profitMargin = "YELLOW";
    else profitMargin = "GREEN";
  }

  const urgencyFactors = getUrgencyDelivery(inputs.urgency);
  const weights = repPricing.map((r) =>
    getSegmentWeight(r.fromIdx, r.toIdx, startIdx, targetIdx, startPct, targetPct, r.isPricedBar)
  );
  let minDays = 0;
  let maxDays = 0;
  for (let i = 0; i < repDelivery.length && i < weights.length; i++) {
    minDays += weights[i] * repDelivery[i].minDays;
    maxDays += weights[i] * repDelivery[i].maxDays;
  }
  minDays = Math.ceil(minDays * urgencyFactors.min);
  maxDays = Math.ceil(maxDays * urgencyFactors.max);

  const repBreakdown = repPricing.map((row, i) => {
    const w = getSegmentWeight(row.fromIdx, row.toIdx, startIdx, targetIdx, startPct, targetPct, row.isPricedBar);
    const rate = row.rate;
    const lineCost = w * rate * 100;
    const delivery = repDelivery[i];
    const minDaysSeg = delivery?.minDays ?? 0;
    const maxDaysSeg = delivery?.maxDays ?? 0;
    const weightedMinDays = w * minDaysSeg;
    const weightedMaxDays = w * maxDaysSeg;
    return {
      fromLabel: row.fromLabel,
      toLabel: row.toLabel,
      rate,
      weight: w,
      lineCost,
      minDaysSeg,
      maxDaysSeg,
      weightedMinDays: weightedMinDays * urgencyFactors.min,
      weightedMaxDays: weightedMaxDays * urgencyFactors.max,
      isActive: w > 0 && row.isPricedBar === 1,
    };
  });

  const timeframeText =
    minDays === maxDays ? `${minDays} Day${minDays === 1 ? "" : "s"}` : `${minDays}–${maxDays} Days`;
  const estimatedTimeframe = (() => {
    if (maxDays <= 10)
      return minDays === maxDays ? `${minDays} Day${minDays === 1 ? "" : "s"}` : `${minDays}–${maxDays} Days`;
    if (maxDays <= 30) {
      const wMin = Math.ceil(minDays / 7);
      const wMax = Math.ceil(maxDays / 7);
      return wMin === wMax ? `~${wMin} Week${wMin === 1 ? "" : "s"}` : `~${wMin}–${wMax} Weeks`;
    }
    const mMin = Math.round((minDays / 30) * 10) / 10;
    const mMax = Math.round((maxDays / 30) * 10) / 10;
    return mMin === mMax ? `~${mMin} Month${mMin === 1 ? "" : "s"}` : `~${mMin}–${mMax} Months`;
  })();

  return {
    startIdx,
    targetIdx,
    barsTouched,
    baseCostMarket,
    baseCostAI,
    volumeModifier,
    lateEfficiencyMultiplier,
    afterLateEffMarket,
    afterLateEffAI,
    marketQuote,
    aiSuggestedQuote,
    aiLowQuote,
    aiHighQuote,
    recommendedQuote,
    marketVsAiDiff,
    marketVsAiGrade,
    discountUsed,
    creatorDiscount,
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
    estimatedTimeframe,
    repBreakdown,
  };
}
