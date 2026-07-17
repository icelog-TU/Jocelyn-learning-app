import type { CreatureVariant } from "../types";

export interface CreatureSpecies {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

/** Original creature species (not based on any existing IP) so the app can
 * safely ship on a public repo. Each species can be drawn as a dad/mom/baby
 * variant, giving a family-collecting mechanic similar to gacha games. */
export const CREATURE_SPECIES: CreatureSpecies[] = [
  { id: "mouse", name: "電鼠", emoji: "🐭", color: "#fff4cf" },
  { id: "turtle", name: "水龜", emoji: "🐢", color: "#d9f2ef" },
  { id: "fox", name: "火狐", emoji: "🦊", color: "#ffe1d6" },
  { id: "rabbit", name: "草兔", emoji: "🐰", color: "#e3f5d8" },
  { id: "cat", name: "星貓", emoji: "🐱", color: "#ece0ff" },
  { id: "sheep", name: "雲羊", emoji: "🐑", color: "#e8f0ff" },
];

export const CREATURE_VARIANTS: CreatureVariant[] = ["dad", "mom", "baby"];

export const VARIANT_LABELS: Record<CreatureVariant, string> = {
  dad: "爸爸",
  mom: "媽媽",
  baby: "寶寶",
};

export const VARIANT_BADGES: Record<CreatureVariant, string> = {
  dad: "🎩",
  mom: "🎀",
  baby: "🍼",
};

/** Stars needed for one gacha draw. */
export const GACHA_COST = 5;

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
