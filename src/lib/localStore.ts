import type { CharacterDoc, CharacterStats, NewCharacterInput } from "../types";
import { dateKey } from "./characters";

function storageKey(familyCode: string): string {
  return `hanzi-local-characters-${familyCode}`;
}

function readAll(familyCode: string): CharacterDoc[] {
  try {
    const raw = localStorage.getItem(storageKey(familyCode));
    return raw ? (JSON.parse(raw) as CharacterDoc[]) : [];
  } catch {
    return [];
  }
}

function writeAll(familyCode: string, chars: CharacterDoc[]): void {
  localStorage.setItem(storageKey(familyCode), JSON.stringify(chars));
  window.dispatchEvent(new CustomEvent("local-characters-changed", { detail: familyCode }));
}

export function subscribeCharactersLocal(
  familyCode: string,
  onChange: (chars: CharacterDoc[]) => void,
): () => void {
  const emit = () => {
    const sorted = [...readAll(familyCode)].sort((a, b) => b.addedAt - a.addedAt);
    onChange(sorted);
  };
  emit();

  const handler = (e: Event) => {
    const detail = (e as CustomEvent<string>).detail;
    if (detail === familyCode) emit();
  };
  window.addEventListener("local-characters-changed", handler);
  window.addEventListener("storage", emit);

  return () => {
    window.removeEventListener("local-characters-changed", handler);
    window.removeEventListener("storage", emit);
  };
}

export async function addCharacterBatchLocal(
  familyCode: string,
  characters: NewCharacterInput[],
): Promise<void> {
  const now = Date.now();
  const todayKey = dateKey(new Date(now));
  const initialStats: CharacterStats = {
    reviewCount: 0,
    correctCount: 0,
    box: 1,
    lastReviewedAt: null,
  };

  const existing = readAll(familyCode);
  const additions: CharacterDoc[] = characters.map((c, i) => ({
    id: `${now}-${i}-${Math.random().toString(36).slice(2, 8)}`,
    hanzi: c.hanzi,
    zhuyin: c.zhuyin,
    bookTitle: "",
    addedAt: now,
    addedDateKey: todayKey,
    stats: initialStats,
  }));

  writeAll(familyCode, [...existing, ...additions]);
}

export async function deleteCharacterLocal(familyCode: string, characterId: string): Promise<void> {
  const existing = readAll(familyCode);
  writeAll(
    familyCode,
    existing.filter((c) => c.id !== characterId),
  );
}
