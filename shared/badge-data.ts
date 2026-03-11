/**
 * NBA 2K26 badges by category (from NBA2KLab).
 * @see https://www.nba2klab.com/badge-descriptions
 */
export const BADGE_CATEGORIES = ["Shooting", "Playmaking", "Finishing", "Defense", "Rebounding", "General"] as const;
export type BadgeCategory = (typeof BADGE_CATEGORIES)[number];

export interface BadgeInfo {
  id: string;
  name: string;
  category: BadgeCategory;
}

/** Badge IDs and display names from NBA2KLab. */
export const BADGES_BY_CATEGORY: Record<BadgeCategory, BadgeInfo[]> = {
  Shooting: [
    { id: "deadeye", name: "Deadeye", category: "Shooting" },
    { id: "limitless-range", name: "Limitless Range", category: "Shooting" },
    { id: "mini-marksman", name: "Mini Marksman", category: "Shooting" },
    { id: "set-shot-specialist", name: "Set Shot Specialist", category: "Shooting" },
    { id: "shifty-shooter", name: "Shifty Shooter", category: "Shooting" },
  ],
  Playmaking: [
    { id: "ankle-assassin", name: "Ankle Assassin", category: "Playmaking" },
    { id: "bail-out", name: "Bail Out", category: "Playmaking" },
    { id: "break-starter", name: "Break Starter", category: "Playmaking" },
    { id: "dimer", name: "Dimer", category: "Playmaking" },
    { id: "handles-for-days", name: "Handles For Days", category: "Playmaking" },
    { id: "lightning-launch", name: "Lightning Launch", category: "Playmaking" },
    { id: "strong-handle", name: "Strong Handle", category: "Playmaking" },
    { id: "unpluckable", name: "Unpluckable", category: "Playmaking" },
    { id: "versatile-visionary", name: "Versatile Visionary", category: "Playmaking" },
  ],
  Finishing: [
    { id: "aerial-wizard", name: "Aerial Wizard", category: "Finishing" },
    { id: "float-game", name: "Float Game", category: "Finishing" },
    { id: "hook-specialist", name: "Hook Specialist", category: "Finishing" },
    { id: "layup-mixmaster", name: "Layup MixMaster", category: "Finishing" },
    { id: "paint-prodigy", name: "Paint Prodigy", category: "Finishing" },
    { id: "physical-finisher", name: "Physical Finisher", category: "Finishing" },
    { id: "post-fade-phenom", name: "Post Fade Phenom", category: "Finishing" },
    { id: "post-powerhouse", name: "Post Powerhouse", category: "Finishing" },
    { id: "post-up-poet", name: "Post Up Poet", category: "Finishing" },
    { id: "posterizer", name: "Posterizer", category: "Finishing" },
    { id: "rise-up", name: "Rise Up", category: "Finishing" },
  ],
  Defense: [
    { id: "challenger", name: "Challenger", category: "Defense" },
    { id: "glove", name: "Glove", category: "Defense" },
    { id: "interceptor", name: "Interceptor", category: "Defense" },
    { id: "high-flying-denier", name: "High Flying Denier", category: "Defense" },
    { id: "immovable-enforcer", name: "Immovable Enforcer", category: "Defense" },
    { id: "off-ball-pest", name: "Off-Ball Pest", category: "Defense" },
    { id: "on-ball-menace", name: "On-Ball Menace", category: "Defense" },
    { id: "paint-patroller", name: "Paint Patroller", category: "Defense" },
    { id: "pick-dodger", name: "Pick Dodger", category: "Defense" },
    { id: "post-lockdown", name: "Post Lockdown", category: "Defense" },
  ],
  Rebounding: [
    { id: "boxout-beast", name: "Boxout Beast", category: "Rebounding" },
    { id: "rebound-chaser", name: "Rebound Chaser", category: "Rebounding" },
  ],
  General: [
    { id: "brick-wall", name: "Brick Wall", category: "General" },
    { id: "slippery-off-ball", name: "Slippery Off-Ball", category: "General" },
    { id: "pogo-stick", name: "Pogo Stick", category: "General" },
  ],
};

/** Flat list of all badges. */
export const ALL_BADGES: BadgeInfo[] = BADGE_CATEGORIES.flatMap((cat) => BADGES_BY_CATEGORY[cat]);

/** Badge levels in NBA 2K26 (Bronze through Legend). */
export const BADGE_LEVELS = ["Bronze", "Silver", "Gold", "Hall of Fame", "Legend"] as const;
export type BadgeLevel = (typeof BADGE_LEVELS)[number];

/** Map badge ID to BadgeInfo for lookup. */
const BADGE_BY_ID = new Map<string, BadgeInfo>(ALL_BADGES.map((b) => [b.id, b]));

/**
 * Format badge list for Discord quote route.
 * 5+ badges: group by category with count (e.g. "Shooting: 3; Playmaking: 2").
 * <5 badges: list individually, grouped by category (e.g. "Shooting: Deadeye, Limitless Range; Playmaking: Dimer").
 */
export function formatBadgeRouteForDiscord(
  badgeBreakdown: Array<{ badgeId: string; badgeName: string }>
): string {
  if (badgeBreakdown.length === 0) return "0 badges";
  const byCategory = new Map<BadgeCategory, string[]>();
  for (const row of badgeBreakdown) {
    const info = BADGE_BY_ID.get(row.badgeId);
    const cat = info?.category ?? "General";
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(row.badgeName);
  }
  if (badgeBreakdown.length >= 5) {
    return BADGE_CATEGORIES.filter((c) => byCategory.has(c))
      .map((c) => `${c}: **${byCategory.get(c)!.length}**`)
      .join(" · ");
  }
  return BADGE_CATEGORIES.filter((c) => byCategory.has(c))
    .map((c) => `${c}: ${byCategory.get(c)!.join(", ")}`)
    .join(" · ");
}

/** Format badge route from badge IDs (e.g. from saved quote inputs). */
export function formatBadgeRouteFromIds(badgeIds: string[]): string {
  const breakdown = badgeIds.map((id) => ({
    badgeId: id,
    badgeName: BADGE_BY_ID.get(id)?.name ?? id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
  }));
  return formatBadgeRouteForDiscord(breakdown);
}
