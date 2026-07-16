import { useEffect, useState } from "react";
import { subscribeToSentenceStats } from "../lib/store";
import type { SentenceStats } from "../types";

const EMPTY_STATS: SentenceStats = {
  totalStars: 0,
  totalSessions: 0,
  lastPracticedAt: null,
};

export function useSentenceStats(familyCode: string | null) {
  const [stats, setStats] = useState<SentenceStats>(EMPTY_STATS);

  useEffect(() => {
    if (!familyCode) {
      setStats(EMPTY_STATS);
      return;
    }
    const unsubscribe = subscribeToSentenceStats(
      familyCode,
      setStats,
      () => setStats(EMPTY_STATS),
    );
    return unsubscribe;
  }, [familyCode]);

  return stats;
}
