import type { CreatureVariant } from "../types";

export interface CreatureSpecies {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

/** Original creature species (not based on any existing IP) so the app can
 * safely ship on a public repo. Each species can be drawn as any of the 9
 * family-role variants below, giving a big family-collecting mechanic. */
export const CREATURE_SPECIES: CreatureSpecies[] = [
  { id: "mouse", name: "電鼠", emoji: "🐭", color: "#fff4cf" },
  { id: "turtle", name: "水龜", emoji: "🐢", color: "#d9f2ef" },
  { id: "fox", name: "火狐", emoji: "🦊", color: "#ffe1d6" },
  { id: "rabbit", name: "草兔", emoji: "🐰", color: "#e3f5d8" },
  { id: "cat", name: "星貓", emoji: "🐱", color: "#ece0ff" },
  { id: "sheep", name: "雲羊", emoji: "🐑", color: "#e8f0ff" },
  { id: "bird", name: "光鳥", emoji: "🐦", color: "#fde8f3" },
  { id: "bear", name: "石熊", emoji: "🐻", color: "#f0e6d2" },
  { id: "penguin", name: "冰企鵝", emoji: "🐧", color: "#dbf3ff" },
  { id: "deer", name: "花鹿", emoji: "🦌", color: "#f7e0e6" },
  { id: "owl", name: "夜梟", emoji: "🦉", color: "#e6e6f0" },
  { id: "horse", name: "彩虹馬", emoji: "🐴", color: "#ffe9f5" },
  { id: "fish", name: "泡泡魚", emoji: "🐠", color: "#d7f0ff" },
  { id: "butterfly", name: "微風蝶", emoji: "🦋", color: "#f3e3ff" },
  { id: "dragon", name: "岩石龍", emoji: "🐉", color: "#e0e8d9" },
  { id: "lion", name: "陽光獅", emoji: "🦁", color: "#fff0d9" },
  { id: "pig", name: "甜心豬", emoji: "🐷", color: "#ffe3ea" },
  { id: "monkey", name: "叢林猴", emoji: "🐵", color: "#e5f7e0" },
  { id: "dolphin", name: "浪花豚", emoji: "🐬", color: "#dff2f7" },
  { id: "wolf", name: "雪狼", emoji: "🐺", color: "#eef0f5" },
];

/** Generational order: grandparents, parents, siblings (older to younger), baby. */
export const CREATURE_VARIANTS: CreatureVariant[] = [
  "grandpa",
  "grandma",
  "dad",
  "mom",
  "olderBrother",
  "olderSister",
  "youngerBrother",
  "youngerSister",
  "baby",
];

export const VARIANT_LABELS: Record<CreatureVariant, string> = {
  grandpa: "爺爺",
  grandma: "奶奶",
  dad: "爸爸",
  mom: "媽媽",
  olderBrother: "哥哥",
  olderSister: "姊姊",
  youngerBrother: "弟弟",
  youngerSister: "妹妹",
  baby: "寶寶",
};

export const VARIANT_BADGES: Record<CreatureVariant, string> = {
  grandpa: "👓",
  grandma: "🧣",
  dad: "🎩",
  mom: "🎀",
  olderBrother: "🧢",
  olderSister: "🌸",
  youngerBrother: "🪀",
  youngerSister: "🎈",
  baby: "🍼",
};

/** Stars needed for one gacha draw. */
export const GACHA_COST = 5;

export interface GiftOption {
  id: string;
  label: string;
  emoji: string;
  cost: number;
  hearts: number;
}

/** Gift shop for raising a specific creature's affection. Bigger gifts are a
 * more star-efficient way to raise hearts, rewarding kids who save up for a
 * favourite creature over spreading stars thin across everyone. */
export const GIFT_OPTIONS: GiftOption[] = [
  { id: "treat", label: "小點心", emoji: "🍬", cost: 2, hearts: 1 },
  { id: "toy", label: "小玩具", emoji: "🧸", cost: 5, hearts: 3 },
  { id: "special", label: "特別禮物", emoji: "💝", cost: 10, hearts: 7 },
];

/** Heart thresholds that unlock a new affection-stage interaction. Stage 0
 * ("初次見面", just met) is always unlocked; these gate stages 1-4
 * ("打招呼"／"一起玩"／"一封信"／"最好的朋友"). */
export const AFFECTION_MILESTONES = [3, 5, 8, 10];

export function speciesById(id: string): CreatureSpecies | undefined {
  return CREATURE_SPECIES.find((s) => s.id === id);
}

export function prizeKey(speciesId: string, variant: CreatureVariant): string {
  return `${speciesId}:${variant}`;
}

/** Every possible species+variant combination, for rendering the full collection grid. */
export function allPrizeKeys(): string[] {
  const keys: string[] = [];
  for (const species of CREATURE_SPECIES) {
    for (const variant of CREATURE_VARIANTS) {
      keys.push(prizeKey(species.id, variant));
    }
  }
  return keys;
}

export function drawRandomPrize(): { speciesId: string; variant: CreatureVariant } {
  const species = CREATURE_SPECIES[Math.floor(Math.random() * CREATURE_SPECIES.length)];
  const variant = CREATURE_VARIANTS[Math.floor(Math.random() * CREATURE_VARIANTS.length)];
  return { speciesId: species.id, variant };
}

/** Number of consecutive already-owned draws that forces the next draw to be
 * a brand-new species+variant — so a losing streak never runs past 6 draws
 * without something to celebrate (5 already-owned in a row, then the 6th is
 * guaranteed new). */
export const PITY_STREAK_LIMIT = 5;

function keyToSpeciesVariant(key: string): { speciesId: string; variant: CreatureVariant } {
  const [speciesId, variant] = key.split(":");
  return { speciesId, variant: variant as CreatureVariant };
}

/** How many draws in a row, most recent first, came up already-owned —
 * replayed from prize history in obtain order (each prize counts as "new" or
 * not based on what was already owned at that point in time, not the
 * present-day owned set). Resets to 0 at the most recent new draw. */
export function computeNoNewStreak(
  prizes: { speciesId: string; variant: CreatureVariant; obtainedAt: number }[],
): number {
  const sorted = [...prizes].sort((a, b) => a.obtainedAt - b.obtainedAt);
  const owned = new Set<string>();
  let streak = 0;
  for (const p of sorted) {
    const key = prizeKey(p.speciesId, p.variant);
    if (owned.has(key)) {
      streak += 1;
    } else {
      streak = 0;
      owned.add(key);
    }
  }
  return streak;
}

/** Draws a random prize, forcing a brand-new species+variant once the no-new
 * streak has hit the pity limit. Falls back to a plain random draw once
 * every combination has already been collected (nothing left to force). */
export function drawPrizeWithPity(
  ownedKeys: Set<string>,
  noNewStreak: number,
): { speciesId: string; variant: CreatureVariant } {
  if (noNewStreak >= PITY_STREAK_LIMIT) {
    const unowned = allPrizeKeys().filter((k) => !ownedKeys.has(k));
    if (unowned.length > 0) {
      const key = unowned[Math.floor(Math.random() * unowned.length)];
      return keyToSpeciesVariant(key);
    }
  }
  return drawRandomPrize();
}

/** Stars still available to spend, after subtracting what's already gone into
 * gacha draws and creature gifts from the lifetime total. Lifetime total can
 * stay far above this once stars have been spent. */
export function computeAvailableStars(
  totalStars: number,
  prizesCount: number,
  affection: { starsSpent: number }[],
): number {
  const spentOnDraws = prizesCount * GACHA_COST;
  const spentOnGifts = affection.reduce((sum, a) => sum + a.starsSpent, 0);
  return Math.max(0, totalStars - spentOnDraws - spentOnGifts);
}
