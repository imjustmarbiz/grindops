/**
 * Customer VIP tier perks.
 * VIP tiers are based on gross lifetime spend (before discounts).
 */

export type VipTierId = "member" | "bronze" | "silver" | "gold" | "platinum";

export interface VipTier {
  id: VipTierId;
  label: string;
  threshold: number;
  discountPct: number;
  perks: string;
  emoji: string;
}

export const VIP_TIERS: VipTier[] = [
  {
    id: "member",
    label: "Member",
    threshold: 0,
    discountPct: 0,
    perks: "Standard member • No VIP benefits yet",
    emoji: "📋",
  },
  {
    id: "bronze",
    label: "Bronze VIP",
    threshold: 500,
    discountPct: 5,
    perks: "5% automatic discount • Bronze badge • Priority queue",
    emoji: "🥉",
  },
  {
    id: "silver",
    label: "Silver VIP",
    threshold: 1000,
    discountPct: 10,
    perks: "10% automatic discount • Silver badge • Priority support • Free rush 1x/month",
    emoji: "🥈",
  },
  {
    id: "gold",
    label: "Gold VIP",
    threshold: 2500,
    discountPct: 15,
    perks: "15% automatic discount • Gold badge • VIP support • Free rush unlimited",
    emoji: "🥇",
  },
  {
    id: "platinum",
    label: "Platinum VIP",
    threshold: 5000,
    discountPct: 20,
    perks: "20% automatic discount • Elite badge • Personal manager • All perks unlocked",
    emoji: "💎",
  },
];

/** Get VIP tier from lifetime spend (gross, before discounts). */
export function getVipTierForSpend(lifetimeSpend: number): VipTier {
  let tier = VIP_TIERS[0];
  for (const t of VIP_TIERS) {
    if (lifetimeSpend >= t.threshold) tier = t;
  }
  return tier;
}
