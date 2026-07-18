import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
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
          staged: data.staged === true,
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
  staged = false,
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
      bookTitle: "",
      addedAt: now,
      addedDateKey: todayKey,
      stats: initialStats,
      createdAt: serverTimestamp(),
      ...(staged ? { staged: true } : {}),
    });
  }

  await batch.commit();
}

export async function deleteCharacterDoc(familyCode: string, characterId: string): Promise<void> {
  if (!db) throw new Error("Firestore is not configured");
  await deleteDoc(doc(db, "families", familyCode, "characters", characterId));
}

/** Promotes a staged (teacher-prep) character to a normal, currently-being-
 * learned one: clears its `staged` flag and resets `addedAt`/`addedDateKey`
 * to today, so it appears as "today's new character" everywhere. Also
 * releases every staged sentence prepared for it (passed in by the caller,
 * since it already has the full sentence list loaded) in the same batch,
 * so the character and its sentences flip over atomically. */
export async function releaseStagedCharacter(
  familyCode: string,
  characterId: string,
  sentenceIds: string[],
): Promise<void> {
  if (!db) throw new Error("Firestore is not configured");
  const now = Date.now();
  const todayKey = dateKey(new Date(now));
  const batch = writeBatch(db);
  batch.update(doc(db, "families", familyCode, "characters", characterId), {
    staged: false,
    addedAt: now,
    addedDateKey: todayKey,
  });
  for (const sentenceId of sentenceIds) {
    batch.update(doc(db, "families", familyCode, "sentences", sentenceId), {
      staged: false,
      createdAt: now,
    });
  }
  await batch.commit();
}

/** Discards a staged character and all its prepared sentences (passed in by
 * the caller) without ever exposing them to the child — used when the
 * parent decides to scrap a prepped batch instead of releasing it. */
export async function discardStagedCharacter(
  familyCode: string,
  characterId: string,
  sentenceIds: string[],
): Promise<void> {
  if (!db) throw new Error("Firestore is not configured");
  const batch = writeBatch(db);
  batch.delete(doc(db, "families", familyCode, "characters", characterId));
  for (const sentenceId of sentenceIds) {
    batch.delete(doc(db, "families", familyCode, "sentences", sentenceId));
  }
  await batch.commit();
}

/** Resets every character's review progress (and therefore its star
 * contribution) back to a freshly-added state, without deleting the
 * character itself. Used for wiping test data while keeping the learned
 * vocabulary list intact. */
export async function resetAllCharacterStats(familyCode: string): Promise<void> {
  if (!db) throw new Error("Firestore is not configured");
  const snapshot = await getDocs(familyCharactersRef(familyCode));
  const resetStats: CharacterStats = { reviewCount: 0, correctCount: 0, box: 1, lastReviewedAt: null };
  const batch = writeBatch(db);
  for (const docSnap of snapshot.docs) {
    batch.update(docSnap.ref, { stats: resetStats });
  }
  await batch.commit();
}
