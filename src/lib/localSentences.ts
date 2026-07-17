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
  }));
  writeAll(familyCode, [...existing, ...additions]);
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
  const updated = existing.map((s) =>
    s.id === sentenceId ? { ...s, text, origin: "edited" as const } : s,
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
