import type { WeakCharDoc } from "../types";

function storageKey(familyCode: string): string {
  return `hanzi-local-weak-chars-${familyCode}`;
}

function readAll(familyCode: string): WeakCharDoc[] {
  try {
    const raw = localStorage.getItem(storageKey(familyCode));
    return raw ? (JSON.parse(raw) as WeakCharDoc[]) : [];
  } catch {
    return [];
  }
}

function writeAll(familyCode: string, weakChars: WeakCharDoc[]): void {
  localStorage.setItem(storageKey(familyCode), JSON.stringify(weakChars));
  window.dispatchEvent(new CustomEvent("local-weak-chars-changed", { detail: familyCode }));
}

export function subscribeWeakCharsLocal(
  familyCode: string,
  onChange: (weakChars: WeakCharDoc[]) => void,
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
  window.addEventListener("local-weak-chars-changed", handler);
  window.addEventListener("storage", emit);

  return () => {
    window.removeEventListener("local-weak-chars-changed", handler);
    window.removeEventListener("storage", emit);
  };
}

export async function addWeakCharLocal(familyCode: string, hanzi: string): Promise<void> {
  const existing = readAll(familyCode);
  if (existing.some((w) => w.hanzi === hanzi)) return;
  const addition: WeakCharDoc = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    hanzi,
    addedAt: Date.now(),
  };
  writeAll(familyCode, [...existing, addition]);
}

export async function removeWeakCharLocal(familyCode: string, id: string): Promise<void> {
  const existing = readAll(familyCode);
  writeAll(
    familyCode,
    existing.filter((w) => w.id !== id),
  );
}
