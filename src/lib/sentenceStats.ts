import { doc, onSnapshot, runTransaction } from "firebase/firestore";
import { db } from "./firebase";
import type { SentenceStats } from "../types";

const EMPTY_STATS: SentenceStats = {
  totalStars: 0,
  totalSessions: 0,
  lastPracticedAt: null,
};

function statsRef(familyCode: string) {
  if (!db) throw new Error("Firestore is not configured");
  return doc(db, "families", familyCode, "meta", "sentenceStats");
}

export function subscribeSentenceStats(
  familyCode: string,
  onChange: (stats: SentenceStats) => void,
  onError: (err: Error) => void,
): () => void {
  return onSnapshot(
    statsRef(familyCode),
    (snap) => {
      if (!snap.exists()) {
        onChange(EMPTY_STATS);
        return;
      }
      const data = snap.data();
      onChange({
        totalStars: data.totalStars ?? 0,
        totalSessions: data.totalSessions ?? 0,
        lastPracticedAt: data.lastPracticedAt ?? null,
      });
    },
    onError,
  );
}

export async function recordSentenceSession(
  familyCode: string,
  starsEarned: number,
): Promise<void> {
  if (!db) throw new Error("Firestore is not configured");
  const ref = statsRef(familyCode);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const current = snap.exists() ? snap.data() : {};
    tx.set(ref, {
      totalStars: (current.totalStars ?? 0) + starsEarned,
      totalSessions: (current.totalSessions ?? 0) + 1,
      lastPracticedAt: Date.now(),
    });
  });
}
