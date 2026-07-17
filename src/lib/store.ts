import { isFirebaseConfigured } from "./firebase";
import { addCharacterBatch, deleteCharacterDoc, subscribeCharacters } from "./characters";
import { addCharacterBatchLocal, deleteCharacterLocal, subscribeCharactersLocal } from "./localStore";
import {
  addSentenceBatch,
  deleteSentenceDoc,
  recordSentenceReviewResult,
  subscribeSentences,
  updateSentenceText,
} from "./sentences";
import {
  addSentenceBatchLocal,
  deleteSentenceLocal,
  recordSentenceReviewResultLocal,
  subscribeSentencesLocal,
  updateSentenceTextLocal,
} from "./localSentences";
import { addWeakChar, removeWeakChar, subscribeWeakChars } from "./weakChars";
import { addWeakCharLocal, removeWeakCharLocal, subscribeWeakCharsLocal } from "./localWeakChars";
import { addPrize, subscribePrizes } from "./prizes";
import { addPrizeLocal, subscribePrizesLocal } from "./localPrizes";
import type {
  CharacterDoc,
  CollectedPrizeDoc,
  CreatureVariant,
  NewCharacterInput,
  NewSentenceEntry,
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
): Promise<void> {
  return isFirebaseConfigured
    ? addCharacterBatch(familyCode, characters)
    : addCharacterBatchLocal(familyCode, characters);
}

export function removeCharacter(familyCode: string, characterId: string): Promise<void> {
  return isFirebaseConfigured
    ? deleteCharacterDoc(familyCode, characterId)
    : deleteCharacterLocal(familyCode, characterId);
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
): Promise<void> {
  return isFirebaseConfigured
    ? addSentenceBatch(familyCode, entries, sourceChars, difficulty)
    : addSentenceBatchLocal(familyCode, entries, sourceChars, difficulty);
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
