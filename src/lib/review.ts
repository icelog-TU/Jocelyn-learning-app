import type { CharacterDoc } from "../types";

// Days until a card in each box becomes due again. Box is 1-indexed.
const BOX_INTERVAL_DAYS = [0, 1, 2, 4, 7, 14];
const DAY_MS = 24 * 60 * 60 * 1000;

function dueScore(char: CharacterDoc, now: number): number {
  if (char.stats.lastReviewedAt === null) return Number.POSITIVE_INFINITY;
  const intervalMs = (BOX_INTERVAL_DAYS[char.stats.box] ?? 14) * DAY_MS;
  const dueAt = char.stats.lastReviewedAt + intervalMs;
  return now - dueAt;
}

/** How many characters are actually due for review right now (no fallback). */
export function countDueForReview(characters: CharacterDoc[]): number {
  const now = Date.now();
  return characters.filter((c) => dueScore(c, now) >= 0).length;
}

/**
 * Picks characters for a review session: never-reviewed and most-overdue
 * cards first, falling back to the whole deck if nothing is due yet.
 */
export function pickReviewSession(
  characters: CharacterDoc[],
  count: number,
): CharacterDoc[] {
  const now = Date.now();
  const sorted = [...characters].sort((a, b) => dueScore(b, now) - dueScore(a, now));
  const due = sorted.filter((c) => dueScore(c, now) >= 0);
  const pool = due.length > 0 ? due : sorted;
  return pool.slice(0, count);
}
