import { isFirebaseConfigured } from "./firebase";
import {
  addCharacterBatch,
  deleteCharacterDoc,
  discardStagedCharacter,
  releaseStagedCharacter,
  resetAllCharacterStats,
  subscribeCharacters,
} from "./characters";
import {
  addCharacterBatchLocal,
  deleteCharacterLocal,
  discardStagedCharacterLocal,
  releaseStagedCharacterLocal,
  resetAllCharacterStatsLocal,
  subscribeCharactersLocal,
} from "./localStore";
import {
  addSentenceBatch,
  deleteSentenceDoc,
  recordSentenceReviewResult,
  resetAllSentenceStats,
  subscribeSentences,
  updateSentenceDifficulty,
  updateSentenceLineBreaks,
  updateSentenceText,
} from "./sentences";
import {
  addSentenceBatchLocal,
  deleteSentenceLocal,
  discardStagedSentencesLocal,
  recordSentenceReviewResultLocal,
  releaseStagedSentencesLocal,
  resetAllSentenceStatsLocal,
  subscribeSentencesLocal,
  updateSentenceDifficultyLocal,
  updateSentenceLineBreaksLocal,
  updateSentenceTextLocal,
} from "./localSentences";
import { addWeakChar, removeWeakChar, subscribeWeakChars } from "./weakChars";
import { addWeakCharLocal, removeWeakCharLocal, subscribeWeakCharsLocal } from "./localWeakChars";
import { addPrize, clearAllPrizes, subscribePrizes } from "./prizes";
import { addPrizeLocal, clearAllPrizesLocal, subscribePrizesLocal } from "./localPrizes";
import { clearAllAffection, giftToCreature, subscribeAffection } from "./affection";
import { clearAllAffectionLocal, giftToCreatureLocal, subscribeAffectionLocal } from "./localAffection";
import { addPlannedCharBatch, movePlannedChar, removePlannedChar, subscribePlannedChars } from "./plannedChars";
import {
  addPlannedCharBatchLocal,
  movePlannedCharLocal,
  removePlannedCharLocal,
  subscribePlannedCharsLocal,
} from "./localPlannedChars";
import type {
  AffectionDoc,
  CharacterDoc,
  CollectedPrizeDoc,
  CreatureVariant,
  NewCharacterInput,
  NewSentenceEntry,
  PlannedCharacterDoc,
  SentenceDifficulty,
  SentenceDoc,
  WeakCharDoc,
} from "../types";

export const usingCloudSync = isFirebaseConfigured;

export function subscribeToCharacters(
  familyCode: string,
  onChange: (chars: CharacterDoc[]) => void,
  onError: (err: Error) => void,
): () => void {
  if (isFirebaseConfigured) {
    return subscribeCharacters(familyCode, onChange, onError);
  }
  return subscribeCharactersLocal(familyCode, onChange);
}

export function saveCharacterBatch(
  familyCode: string,
  characters: NewCharacterInput[],
  staged = false,
): Promise<void> {
  return isFirebaseConfigured
    ? addCharacterBatch(familyCode, characters, staged)
    : addCharacterBatchLocal(familyCode, characters, staged);
}

export function removeCharacter(familyCode: string, characterId: string): Promise<void> {
  return isFirebaseConfigured
    ? deleteCharacterDoc(familyCode, characterId)
    : deleteCharacterLocal(familyCode, characterId);
}

/** Promotes a staged (老師準備區) character and its prepared sentences into
 * the normal learned pool, as if the parent just added them today. */
export async function releaseStagedCharacterAndSentences(
  familyCode: string,
  characterId: string,
  sentenceIds: string[],
): Promise<void> {
  if (isFirebaseConfigured) {
    await releaseStagedCharacter(familyCode, characterId, sentenceIds);
  } else {
    await Promise.all([
      releaseStagedCharacterLocal(familyCode, characterId),
      releaseStagedSentencesLocal(familyCode, sentenceIds),
    ]);
  }
}

/** Discards a staged character and its prepared sentences without ever
 * releasing them to the child. */
export async function discardStagedCharacterAndSentences(
  familyCode: string,
  characterId: string,
  sentenceIds: string[],
): Promise<void> {
  if (isFirebaseConfigured) {
    await discardStagedCharacter(familyCode, characterId, sentenceIds);
  } else {
    await Promise.all([
      discardStagedCharacterLocal(familyCode, characterId),
      discardStagedSentencesLocal(familyCode, sentenceIds),
    ]);
  }
}

export function subscribeToSentences(
  familyCode: string,
  onChange: (sentences: SentenceDoc[]) => void,
  onError: (err: Error) => void,
): () => void {
  if (isFirebaseConfigured) {
    return subscribeSentences(familyCode, onChange, onError);
  }
  return subscribeSentencesLocal(familyCode, onChange);
}

export function saveSentenceBatch(
  familyCode: string,
  entries: NewSentenceEntry[],
  sourceChars: string[],
  difficulty: SentenceDifficulty,
  staged = false,
): Promise<void> {
  return isFirebaseConfigured
    ? addSentenceBatch(familyCode, entries, sourceChars, difficulty, staged)
    : addSentenceBatchLocal(familyCode, entries, sourceChars, difficulty, staged);
}

export function saveSentenceReviewResult(
  familyCode: string,
  sentenceId: string,
  correct: boolean,
): Promise<void> {
  return isFirebaseConfigured
    ? recordSentenceReviewResult(familyCode, sentenceId, correct)
    : recordSentenceReviewResultLocal(familyCode, sentenceId, correct);
}

export function editSentenceText(
  familyCode: string,
  sentenceId: string,
  text: string,
): Promise<void> {
  return isFirebaseConfigured
    ? updateSentenceText(familyCode, sentenceId, text)
    : updateSentenceTextLocal(familyCode, sentenceId, text);
}

export function editSentenceDifficulty(
  familyCode: string,
  sentenceId: string,
  difficulty: SentenceDifficulty,
): Promise<void> {
  return isFirebaseConfigured
    ? updateSentenceDifficulty(familyCode, sentenceId, difficulty)
    : updateSentenceDifficultyLocal(familyCode, sentenceId, difficulty);
}

export function editSentenceLineBreaks(
  familyCode: string,
  sentenceId: string,
  lineBreaks: number[],
): Promise<void> {
  return isFirebaseConfigured
    ? updateSentenceLineBreaks(familyCode, sentenceId, lineBreaks)
    : updateSentenceLineBreaksLocal(familyCode, sentenceId, lineBreaks);
}

export function removeSentence(familyCode: string, sentenceId: string): Promise<void> {
  return isFirebaseConfigured
    ? deleteSentenceDoc(familyCode, sentenceId)
    : deleteSentenceLocal(familyCode, sentenceId);
}

export function subscribeToWeakChars(
  familyCode: string,
  onChange: (weakChars: WeakCharDoc[]) => void,
  onError: (err: Error) => void,
): () => void {
  if (isFirebaseConfigured) {
    return subscribeWeakChars(familyCode, onChange, onError);
  }
  return subscribeWeakCharsLocal(familyCode, onChange);
}

export function saveWeakChar(familyCode: string, hanzi: string): Promise<void> {
  return isFirebaseConfigured
    ? addWeakChar(familyCode, hanzi)
    : addWeakCharLocal(familyCode, hanzi);
}

export function removeWeakCharEntry(familyCode: string, id: string): Promise<void> {
  return isFirebaseConfigured
    ? removeWeakChar(familyCode, id)
    : removeWeakCharLocal(familyCode, id);
}

export function subscribeToPrizes(
  familyCode: string,
  onChange: (prizes: CollectedPrizeDoc[]) => void,
  onError: (err: Error) => void,
): () => void {
  if (isFirebaseConfigured) {
    return subscribePrizes(familyCode, onChange, onError);
  }
  return subscribePrizesLocal(familyCode, onChange);
}

export function savePrize(
  familyCode: string,
  speciesId: string,
  variant: CreatureVariant,
): Promise<void> {
  return isFirebaseConfigured
    ? addPrize(familyCode, speciesId, variant)
    : addPrizeLocal(familyCode, speciesId, variant);
}

export function subscribeToAffection(
  familyCode: string,
  onChange: (affection: AffectionDoc[]) => void,
  onError: (err: Error) => void,
): () => void {
  if (isFirebaseConfigured) {
    return subscribeAffection(familyCode, onChange, onError);
  }
  return subscribeAffectionLocal(familyCode, onChange);
}

export function giveGiftToCreature(
  familyCode: string,
  speciesId: string,
  variant: CreatureVariant,
  hearts: number,
  starsCost: number,
): Promise<void> {
  return isFirebaseConfigured
    ? giftToCreature(familyCode, speciesId, variant, hearts, starsCost)
    : giftToCreatureLocal(familyCode, speciesId, variant, hearts, starsCost);
}

export function subscribeToPlannedChars(
  familyCode: string,
  onChange: (items: PlannedCharacterDoc[]) => void,
  onError: (err: Error) => void,
): () => void {
  if (isFirebaseConfigured) {
    return subscribePlannedChars(familyCode, onChange, onError);
  }
  return subscribePlannedCharsLocal(familyCode, onChange);
}

export function savePlannedCharBatch(familyCode: string, hanziList: string[]): Promise<void> {
  return isFirebaseConfigured
    ? addPlannedCharBatch(familyCode, hanziList)
    : addPlannedCharBatchLocal(familyCode, hanziList);
}

export function removePlannedCharacter(familyCode: string, id: string): Promise<void> {
  return isFirebaseConfigured
    ? removePlannedChar(familyCode, id)
    : removePlannedCharLocal(familyCode, id);
}

export function movePlannedCharacter(
  familyCode: string,
  a: { id: string; createdAt: number },
  b: { id: string; createdAt: number },
): Promise<void> {
  return isFirebaseConfigured ? movePlannedChar(familyCode, a, b) : movePlannedCharLocal(familyCode, a, b);
}

/** Wipes all test/practice progress for a family: every character and
 * sentence's stars go back to zero (the character/sentence entries
 * themselves are kept), and the whole gacha collection (prizes + affection)
 * is cleared. Intentionally not exposed anywhere in the normal navigation —
 * only reachable via the hidden /reset-test-data route — so a child can't
 * stumble into wiping progress by tapping around the app. */
export async function resetAllProgress(familyCode: string): Promise<void> {
  if (isFirebaseConfigured) {
    await Promise.all([
      resetAllCharacterStats(familyCode),
      resetAllSentenceStats(familyCode),
      clearAllPrizes(familyCode),
      clearAllAffection(familyCode),
    ]);
  } else {
    await Promise.all([
      resetAllCharacterStatsLocal(familyCode),
      resetAllSentenceStatsLocal(familyCode),
      clearAllPrizesLocal(familyCode),
      clearAllAffectionLocal(familyCode),
    ]);
  }
}
