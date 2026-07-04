import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import type { CharacterDoc, CharacterStats, NewCharacterInput } from "../types";

function familyCharactersRef(familyCode: string) {
  if (!db) throw new Error("Firestore is not configured");
  return collection(db, "families", familyCode, "characters");
}

export function dateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function subscribeCharacters(
  familyCode: string,
  onChange: (chars: CharacterDoc[]) => void,
  onError: (err: Error) => void,
): () => void {
  const q = query(familyCharactersRef(familyCode), orderBy("addedAt", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const chars: CharacterDoc[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          hanzi: data.hanzi,
          zhuyin: data.zhuyin,
          bookTitle: data.bookTitle ?? "",
          addedAt: data.addedAt ?? 0,
          addedDateKey: data.addedDateKey ?? dateKey(new Date(data.addedAt ?? Date.now())),
          stats: {
            reviewCount: data.stats?.reviewCount ?? 0,
            correctCount: data.stats?.correctCount ?? 0,
            box: data.stats?.box ?? 1,
            lastReviewedAt: data.stats?.lastReviewedAt ?? null,
          },
        };
      });
      onChange(chars);
    },
    onError,
  );
}

export async function addCharacterBatch(
  familyCode: string,
  characters: NewCharacterInput[],
  bookTitle: string,
): Promise<void> {
  const batch = writeBatch(db!);
  const now = Date.now();
  const todayKey = dateKey(new Date(now));
  const ref = familyCharactersRef(familyCode);

  const initialStats: CharacterStats = {
    reviewCount: 0,
    correctCount: 0,
    box: 1,
    lastReviewedAt: null,
  };

  for (const char of characters) {
    const newDoc = doc(ref);
    batch.set(newDoc, {
      hanzi: char.hanzi,
      zhuyin: char.zhuyin,
      bookTitle: bookTitle.trim(),
      addedAt: now,
      addedDateKey: todayKey,
      stats: initialStats,
      createdAt: serverTimestamp(),
    });
  }

  await batch.commit();
}

const MAX_BOX = 5;

export async function recordReviewResult(
  familyCode: string,
  charId: string,
  correct: boolean,
): Promise<void> {
  if (!db) throw new Error("Firestore is not configured");
  const ref = doc(db, "families", familyCode, "characters", charId);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const data = snap.data();
    const stats: CharacterStats = {
      reviewCount: (data.stats?.reviewCount ?? 0) + 1,
      correctCount: (data.stats?.correctCount ?? 0) + (correct ? 1 : 0),
      box: correct
        ? Math.min((data.stats?.box ?? 1) + 1, MAX_BOX)
        : 1,
      lastReviewedAt: Date.now(),
    };
    tx.update(ref, { stats });
  });
}
