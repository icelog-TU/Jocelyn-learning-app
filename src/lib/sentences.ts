import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import { nextStats } from "./review";
import type { CharacterStats, NewSentenceEntry, SentenceDifficulty, SentenceDoc } from "../types";

function familySentencesRef(familyCode: string) {
  if (!db) throw new Error("Firestore is not configured");
  return collection(db, "families", familyCode, "sentences");
}

export function subscribeSentences(
  familyCode: string,
  onChange: (sentences: SentenceDoc[]) => void,
  onError: (err: Error) => void,
): () => void {
  const q = query(familySentencesRef(familyCode), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const sentences: SentenceDoc[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          text: data.text ?? "",
          sourceChars: Array.isArray(data.sourceChars) ? data.sourceChars : [],
          difficulty: data.difficulty ?? "medium",
          origin: data.origin ?? "ai",
          createdAt: data.createdAt ?? 0,
          stats: {
            reviewCount: data.stats?.reviewCount ?? 0,
            correctCount: data.stats?.correctCount ?? 0,
            box: data.stats?.box ?? 1,
            lastReviewedAt: data.stats?.lastReviewedAt ?? null,
          },
        };
      });
      onChange(sentences);
    },
    onError,
  );
}

const INITIAL_STATS: CharacterStats = {
  reviewCount: 0,
  correctCount: 0,
  box: 1,
  lastReviewedAt: null,
};

export async function addSentenceBatch(
  familyCode: string,
  entries: NewSentenceEntry[],
  sourceChars: string[],
  difficulty: SentenceDifficulty,
): Promise<void> {
  const batch = writeBatch(db!);
  const now = Date.now();
  const ref = familySentencesRef(familyCode);

  for (const entry of entries) {
    const newDoc = doc(ref);
    batch.set(newDoc, {
      text: entry.text,
      sourceChars,
      difficulty,
      origin: entry.origin,
      createdAt: now,
      stats: INITIAL_STATS,
    });
  }

  await batch.commit();
}

export async function recordSentenceReviewResult(
  familyCode: string,
  sentenceId: string,
  correct: boolean,
): Promise<void> {
  if (!db) throw new Error("Firestore is not configured");
  const ref = doc(db, "families", familyCode, "sentences", sentenceId);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const data = snap.data();
    const current: CharacterStats = {
      reviewCount: data.stats?.reviewCount ?? 0,
      correctCount: data.stats?.correctCount ?? 0,
      box: data.stats?.box ?? 1,
      lastReviewedAt: data.stats?.lastReviewedAt ?? null,
    };
    tx.update(ref, { stats: nextStats(current, correct) });
  });
}

export async function updateSentenceText(
  familyCode: string,
  sentenceId: string,
  text: string,
): Promise<void> {
  if (!db) throw new Error("Firestore is not configured");
  await updateDoc(doc(db, "families", familyCode, "sentences", sentenceId), {
    text,
    origin: "edited",
  });
}

export async function deleteSentenceDoc(familyCode: string, sentenceId: string): Promise<void> {
  if (!db) throw new Error("Firestore is not configured");
  await deleteDoc(doc(db, "families", familyCode, "sentences", sentenceId));
}
