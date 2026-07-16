import { isFirebaseConfigured } from "./firebase";
import { addCharacterBatch, recordReviewResult, subscribeCharacters } from "./characters";
import {
  addCharacterBatchLocal,
  recordReviewResultLocal,
  subscribeCharactersLocal,
} from "./localStore";
import { recordSentenceSession, subscribeSentenceStats } from "./sentenceStats";
import {
  recordSentenceSessionLocal,
  subscribeSentenceStatsLocal,
} from "./localSentenceStats";
import type { CharacterDoc, NewCharacterInput, SentenceStats } from "../types";

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
  bookTitle: string,
): Promise<void> {
  return isFirebaseConfigured
    ? addCharacterBatch(familyCode, characters, bookTitle)
    : addCharacterBatchLocal(familyCode, characters, bookTitle);
}

export function saveReviewResult(
  familyCode: string,
  charId: string,
  correct: boolean,
): Promise<void> {
  return isFirebaseConfigured
    ? recordReviewResult(familyCode, charId, correct)
    : recordReviewResultLocal(familyCode, charId, correct);
}

export function subscribeToSentenceStats(
  familyCode: string,
  onChange: (stats: SentenceStats) => void,
  onError: (err: Error) => void,
): () => void {
  if (isFirebaseConfigured) {
    return subscribeSentenceStats(familyCode, onChange, onError);
  }
  return subscribeSentenceStatsLocal(familyCode, onChange);
}

export function saveSentenceSession(familyCode: string, starsEarned: number): Promise<void> {
  return isFirebaseConfigured
    ? recordSentenceSession(familyCode, starsEarned)
    : recordSentenceSessionLocal(familyCode, starsEarned);
}
