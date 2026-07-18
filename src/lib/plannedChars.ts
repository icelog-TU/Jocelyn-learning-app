import { collection, deleteDoc, doc, onSnapshot, orderBy, query, writeBatch } from "firebase/firestore";
import { db } from "./firebase";
import type { PlannedCharacterDoc } from "../types";

function familyPlannedCharsRef(familyCode: string) {
  if (!db) throw new Error("Firestore is not configured");
  return collection(db, "families", familyCode, "plannedChars");
}

export function subscribePlannedChars(
  familyCode: string,
  onChange: (items: PlannedCharacterDoc[]) => void,
  onError: (err: Error) => void,
): () => void {
  const q = query(familyPlannedCharsRef(familyCode), orderBy("createdAt", "asc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: PlannedCharacterDoc[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return { id: docSnap.id, hanzi: data.hanzi ?? "", createdAt: data.createdAt ?? 0 };
      });
      onChange(items);
    },
    onError,
  );
}

export async function addPlannedCharBatch(familyCode: string, hanziList: string[]): Promise<void> {
  const batch = writeBatch(db!);
  const ref = familyPlannedCharsRef(familyCode);
  const now = Date.now();
  hanziList.forEach((hanzi, i) => {
    const newDoc = doc(ref);
    batch.set(newDoc, { hanzi, createdAt: now + i });
  });
  await batch.commit();
}

export async function removePlannedChar(familyCode: string, id: string): Promise<void> {
  if (!db) throw new Error("Firestore is not configured");
  await deleteDoc(doc(db, "families", familyCode, "plannedChars", id));
}

/** Swaps two planned items' positions by swapping their `createdAt` values
 * (the field the list is sorted by) — used to move an item up/down one slot
 * without needing a separate explicit ordering field. */
export async function movePlannedChar(
  familyCode: string,
  a: { id: string; createdAt: number },
  b: { id: string; createdAt: number },
): Promise<void> {
  if (!db) throw new Error("Firestore is not configured");
  const batch = writeBatch(db);
  batch.update(doc(db, "families", familyCode, "plannedChars", a.id), { createdAt: b.createdAt });
  batch.update(doc(db, "families", familyCode, "plannedChars", b.id), { createdAt: a.createdAt });
  await batch.commit();
}
