import { addDoc, collection, deleteDoc, getDocs, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "./firebase";
import type { CollectedPrizeDoc, CreatureVariant } from "../types";

function familyPrizesRef(familyCode: string) {
  if (!db) throw new Error("Firestore is not configured");
  return collection(db, "families", familyCode, "prizes");
}

export function subscribePrizes(
  familyCode: string,
  onChange: (prizes: CollectedPrizeDoc[]) => void,
  onError: (err: Error) => void,
): () => void {
  const q = query(familyPrizesRef(familyCode), orderBy("obtainedAt", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const prizes: CollectedPrizeDoc[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          speciesId: data.speciesId ?? "",
          variant: (data.variant ?? "baby") as CreatureVariant,
          obtainedAt: data.obtainedAt ?? 0,
        };
      });
      onChange(prizes);
    },
    onError,
  );
}

export async function addPrize(
  familyCode: string,
  speciesId: string,
  variant: CreatureVariant,
): Promise<void> {
  if (!db) throw new Error("Firestore is not configured");
  await addDoc(familyPrizesRef(familyCode), { speciesId, variant, obtainedAt: Date.now() });
}

export async function clearAllPrizes(familyCode: string): Promise<void> {
  if (!db) throw new Error("Firestore is not configured");
  const snapshot = await getDocs(familyPrizesRef(familyCode));
  await Promise.all(snapshot.docs.map((docSnap) => deleteDoc(docSnap.ref)));
}
