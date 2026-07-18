import { doc, writeBatch, type WriteBatch } from "firebase/firestore";
import { db, ensureSignedIn, isFirebaseConfigured } from "./firebase";
import { peekCharactersLocal } from "./localStore";
import { peekSentencesLocal } from "./localSentences";
import { peekWeakCharsLocal } from "./localWeakChars";
import { peekPrizesLocal } from "./localPrizes";
import { peekAffectionLocal } from "./localAffection";
import { peekPlannedCharsLocal } from "./localPlannedChars";

export interface LocalBackupSummary {
  characters: number;
  sentences: number;
  weakChars: number;
  prizes: number;
  affection: number;
  plannedChars: number;
}

const EMPTY_SUMMARY: LocalBackupSummary = {
  characters: 0,
  sentences: 0,
  weakChars: 0,
  prizes: 0,
  affection: 0,
  plannedChars: 0,
};

export function peekLocalBackupSummary(familyCode: string): LocalBackupSummary {
  return {
    characters: peekCharactersLocal(familyCode).length,
    sentences: peekSentencesLocal(familyCode).length,
    weakChars: peekWeakCharsLocal(familyCode).length,
    prizes: peekPrizesLocal(familyCode).length,
    affection: peekAffectionLocal(familyCode).length,
    plannedChars: peekPlannedCharsLocal(familyCode).length,
  };
}

export function hasLocalDataToBackUp(familyCode: string): boolean {
  const s = peekLocalBackupSummary(familyCode);
  return s.characters + s.sentences + s.weakChars + s.prizes + s.affection + s.plannedChars > 0;
}

// Firestore batches top out at 500 writes; leave headroom below that.
const BATCH_LIMIT = 400;

async function commitInChunks(writes: Array<(batch: WriteBatch) => void>): Promise<void> {
  if (!db) throw new Error("Firestore is not configured");
  for (let i = 0; i < writes.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    for (const write of writes.slice(i, i + BATCH_LIMIT)) write(batch);
    await batch.commit();
  }
}

/** One-time migration: copies everything currently sitting in this device's
 * localStorage (left over from before cloud sync was set up) up into
 * Firestore under the same family code. Each local record's existing id is
 * reused as the Firestore doc id, so running this more than once is safe —
 * it overwrites the same cloud docs instead of duplicating them. Local data
 * is left untouched afterwards. */
export async function backupLocalDataToCloud(familyCode: string): Promise<LocalBackupSummary> {
  if (!isFirebaseConfigured || !db) {
    throw new Error("尚未設定雲端同步，無法備份");
  }

  const characters = peekCharactersLocal(familyCode);
  const sentences = peekSentencesLocal(familyCode);
  const weakChars = peekWeakCharsLocal(familyCode);
  const prizes = peekPrizesLocal(familyCode);
  const affection = peekAffectionLocal(familyCode);
  const plannedChars = peekPlannedCharsLocal(familyCode);

  if (
    characters.length +
      sentences.length +
      weakChars.length +
      prizes.length +
      affection.length +
      plannedChars.length ===
    0
  ) {
    return EMPTY_SUMMARY;
  }

  await ensureSignedIn();

  const writes: Array<(batch: WriteBatch) => void> = [];

  for (const c of characters) {
    writes.push((batch) =>
      batch.set(doc(db!, "families", familyCode, "characters", c.id), {
        hanzi: c.hanzi,
        zhuyin: c.zhuyin,
        bookTitle: c.bookTitle ?? "",
        addedAt: c.addedAt,
        addedDateKey: c.addedDateKey,
        stats: c.stats,
      }),
    );
  }
  for (const s of sentences) {
    writes.push((batch) =>
      batch.set(doc(db!, "families", familyCode, "sentences", s.id), {
        text: s.text,
        sourceChars: s.sourceChars,
        difficulty: s.difficulty,
        origin: s.origin,
        createdAt: s.createdAt,
        stats: s.stats,
      }),
    );
  }
  for (const w of weakChars) {
    writes.push((batch) =>
      batch.set(doc(db!, "families", familyCode, "weakChars", w.id), {
        hanzi: w.hanzi,
        addedAt: w.addedAt,
      }),
    );
  }
  for (const p of prizes) {
    writes.push((batch) =>
      batch.set(doc(db!, "families", familyCode, "prizes", p.id), {
        speciesId: p.speciesId,
        variant: p.variant,
        obtainedAt: p.obtainedAt,
      }),
    );
  }
  for (const a of affection) {
    writes.push((batch) =>
      batch.set(
        doc(db!, "families", familyCode, "affection", a.id),
        {
          speciesId: a.speciesId,
          variant: a.variant,
          hearts: a.hearts,
          starsSpent: a.starsSpent,
          updatedAt: a.updatedAt,
        },
        { merge: true },
      ),
    );
  }
  for (const p of plannedChars) {
    writes.push((batch) =>
      batch.set(doc(db!, "families", familyCode, "plannedChars", p.id), {
        hanzi: p.hanzi,
        createdAt: p.createdAt,
      }),
    );
  }

  await commitInChunks(writes);

  return {
    characters: characters.length,
    sentences: sentences.length,
    weakChars: weakChars.length,
    prizes: prizes.length,
    affection: affection.length,
    plannedChars: plannedChars.length,
  };
}
