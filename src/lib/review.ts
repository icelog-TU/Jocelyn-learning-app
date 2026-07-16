import type { CharacterStats } from "../types";

export interface Reviewable {
  stats: CharacterStats;
}

// Days until a card in each box becomes due again. Box is 1-indexed.
const BOX_INTERVAL_DAYS = [0, 1, 2, 4, 7, 14];
const DAY_MS = 24 * 60 * 60 * 1000;

function dueScore(item: Reviewable, now: number): number {
  if (item.stats.lastReviewedAt === null) return Number.POSITIVE_INFINITY;
  const intervalMs = (BOX_INTERVAL_DAYS[item.stats.box] ?? 14) * DAY_MS;
  const dueAt = item.stats.lastReviewedAt + intervalMs;
  return now - dueAt;
}

/** How many items are actually due for review right now (no fallback). */
export function countDueForReview<T extends Reviewable>(items: T[]): number {
  const now = Date.now();
  return items.filter((item) => dueScore(item, now) >= 0).length;
}

/**
 * Picks items for a review session: never-reviewed and most-overdue items
 * first, falling back to the whole deck if nothing is due yet.
 */
export function pickReviewSession<T extends Reviewable>(items: T[], count: number): T[] {
  const now = Date.now();
  const sorted = [...items].sort((a, b) => dueScore(b, now) - dueScore(a, now));
  const due = sorted.filter((item) => dueScore(item, now) >= 0);
  const pool = due.length > 0 ? due : sorted;
  return pool.slice(0, count);
}

/** Next box/stats after a review result, following the same rules as characters. */
export function nextStats(current: CharacterStats, correct: boolean): CharacterStats {
  return {
    reviewCount: current.reviewCount + 1,
    correctCount: current.correctCount + (correct ? 1 : 0),
    box: correct ? Math.min(current.box + 1, 5) : 1,
    lastReviewedAt: Date.now(),
  };
}
