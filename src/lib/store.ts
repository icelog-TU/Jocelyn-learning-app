import { isFirebaseConfigured } from "./firebase";
import { addCharacterBatch, recordReviewResult, subscribeCharacters } from "./characters";
import {
  addCharacterBatchLocal,
  recordReviewResultLocal,
  subscribeCharactersLocal,
} from "./localStore";
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
import type { CharacterDoc, NewCharacterInput, SentenceDifficulty, SentenceDoc } from "../types";

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
  texts: string[],
  sourceChars: string[],
  difficulty: SentenceDifficulty,
): Promise<void> {
  return isFirebaseConfigured
    ? addSentenceBatch(familyCode, texts, sourceChars, difficulty)
    : addSentenceBatchLocal(familyCode, texts, sourceChars, difficulty);
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
