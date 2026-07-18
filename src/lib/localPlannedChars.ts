import type { PlannedCharacterDoc } from "../types";

function storageKey(familyCode: string): string {
  return `hanzi-local-planned-chars-${familyCode}`;
}

function readAll(familyCode: string): PlannedCharacterDoc[] {
  try {
    const raw = localStorage.getItem(storageKey(familyCode));
    return raw ? (JSON.parse(raw) as PlannedCharacterDoc[]) : [];
  } catch {
    return [];
  }
}

function writeAll(familyCode: string, items: PlannedCharacterDoc[]): void {
  localStorage.setItem(storageKey(familyCode), JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("local-planned-chars-changed", { detail: familyCode }));
}

/** Synchronous snapshot of everything currently in this device's local
 * storage, without subscribing to changes. Used by the cloud-backup flow. */
export function peekPlannedCharsLocal(familyCode: string): PlannedCharacterDoc[] {
  return readAll(familyCode);
}

export function subscribePlannedCharsLocal(
  familyCode: string,
  onChange: (items: PlannedCharacterDoc[]) => void,
): () => void {
  const emit = () => {
    const sorted = [...readAll(familyCode)].sort((a, b) => a.createdAt - b.createdAt);
    onChange(sorted);
  };
  emit();

  const handler = (e: Event) => {
    const detail = (e as CustomEvent<string>).detail;
    if (detail === familyCode) emit();
  };
  window.addEventListener("local-planned-chars-changed", handler);
  window.addEventListener("storage", emit);

  return () => {
    window.removeEventListener("local-planned-chars-changed", handler);
    window.removeEventListener("storage", emit);
  };
}

export async function addPlannedCharBatchLocal(familyCode: string, hanziList: string[]): Promise<void> {
  const now = Date.now();
  const existing = readAll(familyCode);
  const additions: PlannedCharacterDoc[] = hanziList.map((hanzi, i) => ({
    id: `${now}-${i}-${Math.random().toString(36).slice(2, 8)}`,
    hanzi,
    createdAt: now + i,
  }));
  writeAll(familyCode, [...existing, ...additions]);
}

export async function removePlannedCharLocal(familyCode: string, id: string): Promise<void> {
  const existing = readAll(familyCode);
  writeAll(
    familyCode,
    existing.filter((p) => p.id !== id),
  );
}

export async function movePlannedCharLocal(
  familyCode: string,
  a: { id: string; createdAt: number },
  b: { id: string; createdAt: number },
): Promise<void> {
  const existing = readAll(familyCode);
  writeAll(
    familyCode,
    existing.map((p) => {
      if (p.id === a.id) return { ...p, createdAt: b.createdAt };
      if (p.id === b.id) return { ...p, createdAt: a.createdAt };
      return p;
    }),
  );
}
