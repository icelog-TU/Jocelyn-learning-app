import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import type { WeakCharDoc } from "../types";

function familyWeakCharsRef(familyCode: string) {
  if (!db) throw new Error("Firestore is not configured");
  return collection(db, "families", familyCode, "weakChars");
}

export function subscribeWeakChars(
  familyCode: string,
  onChange: (weakChars: WeakCharDoc[]) => void,
  onError: (err: Error) => void,
): () => void {
  const q = query(familyWeakCharsRef(familyCode), orderBy("addedAt", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const weakChars: WeakCharDoc[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          hanzi: data.hanzi ?? "",
          addedAt: data.addedAt ?? 0,
        };
      });
      onChange(weakChars);
    },
    onError,
  );
}

export async function addWeakChar(familyCode: string, hanzi: string): Promise<void> {
  if (!db) throw new Error("Firestore is not configured");
  const ref = familyWeakCharsRef(familyCode);
  const existing = await getDocs(query(ref, where("hanzi", "==", hanzi)));
  if (!existing.empty) return;
  await addDoc(ref, { hanzi, addedAt: Date.now() });
}

export async function removeWeakChar(familyCode: string, id: string): Promise<void> {
  if (!db) throw new Error("Firestore is not configured");
  await deleteDoc(doc(db, "families", familyCode, "weakChars", id));
}
