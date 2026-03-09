/**
 * MyPlayer Type settings for Badge Grinding Quote Generator.
 * Non-Rebirth adds to cost; Rebirth also adds to cost.
 * Stored in queue_config.my_player_type_settings.
 */
export type MyPlayerType = "Non-Rebirth" | "Rebirth";

export interface MyPlayerTypeSettings {
  /** Amount added to cost when Non-Rebirth is selected. Default 100. */
  nonRebirthAdd: number;
  /** Amount added to cost when Rebirth is selected. Default 100. */
  rebirthAdd: number;
}

export function getDefaultMyPlayerTypeSettings(): MyPlayerTypeSettings {
  return {
    nonRebirthAdd: 100,
    rebirthAdd: 100,
  };
}

export function mergeMyPlayerTypeSettings(
  saved: Partial<MyPlayerTypeSettings> & { rebirthDeduct?: number } | null | undefined
): MyPlayerTypeSettings {
  const def = getDefaultMyPlayerTypeSettings();
  if (!saved || typeof saved !== "object") return def;
  const rebirthAdd = typeof saved.rebirthAdd === "number" && saved.rebirthAdd >= 0
    ? saved.rebirthAdd
    : (typeof saved.rebirthDeduct === "number" && saved.rebirthDeduct >= 0 ? saved.rebirthDeduct : def.rebirthAdd);
  return {
    nonRebirthAdd: typeof saved.nonRebirthAdd === "number" && saved.nonRebirthAdd >= 0 ? saved.nonRebirthAdd : def.nonRebirthAdd,
    rebirthAdd,
  };
}
