import type { CharacterStats, NewSentenceEntry, SentenceDifficulty, SentenceDoc } from "../types";
import { nextStats } from "./review";

function storageKey(familyCode: string): string {
  return `hanzi-local-sentences-${familyCode}`;
}

function readAll(familyCode: string): SentenceDoc[] {
  try {
    const raw = localStorage.getItem(storageKey(familyCode));
    const parsed = raw ? (JSON.parse(raw) as SentenceDoc[]) : [];
    // Sentences saved before difficulty/origin existed default sensibly.
    return parsed.map((s) => ({ ...s, difficulty: s.difficulty ?? "medium", origin: s.origin ?? "ai" }));
  } catch {
    return [];
  }
}

function writeAll(familyCode: string, sentences: SentenceDoc[]): void {
  localStorage.setItem(storageKey(familyCode), JSON.stringify(sentences));
  window.dispatchEvent(new CustomEvent("local-sentences-changed", { detail: familyCode }));
}

/** Synchronous snapshot of everything currently in this device's local
 * storage, without subscribing to changes. Used by the cloud-backup flow. */
export function peekSentencesLocal(familyCode: string): SentenceDoc[] {
  return readAll(familyCode);
}

export function subscribeSentencesLocal(
  familyCode: string,
  onChange: (sentences: SentenceDoc[]) => void,
): () => void {
  const emit = () => {
    const sorted = [...readAll(familyCode)].sort((a, b) => b.createdAt - a.createdAt);
    onChange(sorted);
  };
  emit();

  const handler = (e: Event) => {
    const detail = (e as CustomEvent<string>).detail;
    if (detail === familyCode) emit();
  };
  window.addEventListener("local-sentences-changed", handler);
  window.addEventListener("storage", emit);

  return () => {
    window.removeEventListener("local-sentences-changed", handler);
    window.removeEventListener("storage", emit);
  };
}

const INITIAL_STATS: CharacterStats = {
  reviewCount: 0,
  correctCount: 0,
  box: 1,
  lastReviewedAt: null,
};

export async function addSentenceBatchLocal(
  familyCode: string,
  entries: NewSentenceEntry[],
  sourceChars: string[],
  difficulty: SentenceDifficulty,
  staged = false,
): Promise<void> {
  const now = Date.now();
  const existing = readAll(familyCode);
  const additions: SentenceDoc[] = entries.map((entry, i) => ({
    id: `${now}-${i}-${Math.random().toString(36).slice(2, 8)}`,
    text: entry.text,
    sourceChars,
    difficulty,
    origin: entry.origin,
    createdAt: now,
    stats: INITIAL_STATS,
    ...(staged ? { staged: true } : {}),
  }));
  writeAll(familyCode, [...existing, ...additions]);
}

/** Local-storage counterpart to the sentence side of releaseStagedCharacter():
 * clears `staged` and bumps `createdAt` to now for the given sentences, so
 * they group into "today's batch" in the sentence history. */
export async function releaseStagedSentencesLocal(familyCode: string, sentenceIds: string[]): Promise<void> {
  const now = Date.now();
  const ids = new Set(sentenceIds);
  const existing = readAll(familyCode);
  writeAll(
    familyCode,
    existing.map((s) => (ids.has(s.id) ? { ...s, staged: false, createdAt: now } : s)),
  );
}

export async function discardStagedSentencesLocal(familyCode: string, sentenceIds: string[]): Promise<void> {
  const ids = new Set(sentenceIds);
  const existing = readAll(familyCode);
  writeAll(
    familyCode,
    existing.filter((s) => !ids.has(s.id)),
  );
}

export async function recordSentenceReviewResultLocal(
  familyCode: string,
  sentenceId: string,
  correct: boolean,
): Promise<void> {
  const existing = readAll(familyCode);
  const updated = existing.map((s) =>
    s.id === sentenceId ? { ...s, stats: nextStats(s.stats, correct) } : s,
  );
  writeAll(familyCode, updated);
}

export async function updateSentenceTextLocal(
  familyCode: string,
  sentenceId: string,
  text: string,
): Promise<void> {
  const existing = readAll(familyCode);
  // Manual line breaks are character offsets into the old text, so they'd
  // point at the wrong place (or be out of range) once the text changes.
  const updated = existing.map((s) =>
    s.id === sentenceId ? { ...s, text, origin: "edited" as const, lineBreaks: undefined } : s,
  );
  writeAll(familyCode, updated);
}

export async function updateSentenceDifficultyLocal(
  familyCode: string,
  sentenceId: string,
  difficulty: SentenceDifficulty,
): Promise<void> {
  const existing = readAll(familyCode);
  const updated = existing.map((s) => (s.id === sentenceId ? { ...s, difficulty } : s));
  writeAll(familyCode, updated);
}

export async function updateSentenceLineBreaksLocal(
  familyCode: string,
  sentenceId: string,
  lineBreaks: number[],
): Promise<void> {
  const existing = readAll(familyCode);
  const updated = existing.map((s) =>
    s.id === sentenceId ? { ...s, lineBreaks: lineBreaks.length > 0 ? lineBreaks : undefined } : s,
  );
  writeAll(familyCode, updated);
}

export async function deleteSentenceLocal(familyCode: string, sentenceId: string): Promise<void> {
  const existing = readAll(familyCode);
  writeAll(
    familyCode,
    existing.filter((s) => s.id !== sentenceId),
  );
}

export async function resetAllSentenceStatsLocal(familyCode: string): Promise<void> {
  const existing = readAll(familyCode);
  writeAll(
    familyCode,
    existing.map((s) => ({ ...s, stats: INITIAL_STATS })),
  );
}
