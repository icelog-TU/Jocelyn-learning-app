import { collection, doc, increment, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { prizeKey } from "./gachaCatalog";
import type { AffectionDoc, CreatureVariant } from "../types";

function familyAffectionRef(familyCode: string) {
  if (!db) throw new Error("Firestore is not configured");
  return collection(db, "families", familyCode, "affection");
}

export function subscribeAffection(
  familyCode: string,
  onChange: (affection: AffectionDoc[]) => void,
  onError: (err: Error) => void,
): () => void {
  return onSnapshot(
    familyAffectionRef(familyCode),
    (snapshot) => {
      const affection: AffectionDoc[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          speciesId: data.speciesId ?? "",
          variant: (data.variant ?? "baby") as CreatureVariant,
          hearts: data.hearts ?? 0,
          starsSpent: data.starsSpent ?? 0,
          updatedAt: data.updatedAt ?? 0,
        };
      });
      onChange(affection);
    },
    onError,
  );
}

export async function giftToCreature(
  familyCode: string,
  speciesId: string,
  variant: CreatureVariant,
  hearts: number,
  starsCost: number,
): Promise<void> {
  if (!db) throw new Error("Firestore is not configured");
  const key = prizeKey(speciesId, variant);
  await setDoc(
    doc(db, "families", familyCode, "affection", key),
    { speciesId, variant, hearts: increment(hearts), starsSpent: increment(starsCost), updatedAt: Date.now() },
    { merge: true },
  );
}
