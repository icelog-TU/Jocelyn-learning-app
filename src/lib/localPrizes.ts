import type { CollectedPrizeDoc, CreatureVariant } from "../types";

function storageKey(familyCode: string): string {
  return `hanzi-local-prizes-${familyCode}`;
}

function readAll(familyCode: string): CollectedPrizeDoc[] {
  try {
    const raw = localStorage.getItem(storageKey(familyCode));
    return raw ? (JSON.parse(raw) as CollectedPrizeDoc[]) : [];
  } catch {
    return [];
  }
}

function writeAll(familyCode: string, prizes: CollectedPrizeDoc[]): void {
  localStorage.setItem(storageKey(familyCode), JSON.stringify(prizes));
  window.dispatchEvent(new CustomEvent("local-prizes-changed", { detail: familyCode }));
}

/** Synchronous snapshot of everything currently in this device's local
 * storage, without subscribing to changes. Used by the cloud-backup flow. */
export function peekPrizesLocal(familyCode: string): CollectedPrizeDoc[] {
  return readAll(familyCode);
}

export function subscribePrizesLocal(
  familyCode: string,
  onChange: (prizes: CollectedPrizeDoc[]) => void,
): () => void {
  const emit = () => {
    const sorted = [...readAll(familyCode)].sort((a, b) => b.obtainedAt - a.obtainedAt);
    onChange(sorted);
  };
  emit();

  const handler = (e: Event) => {
    const detail = (e as CustomEvent<string>).detail;
    if (detail === familyCode) emit();
  };
  window.addEventListener("local-prizes-changed", handler);
  window.addEventListener("storage", emit);

  return () => {
    window.removeEventListener("local-prizes-changed", handler);
    window.removeEventListener("storage", emit);
  };
}

export async function clearAllPrizesLocal(familyCode: string): Promise<void> {
  writeAll(familyCode, []);
}

export async function addPrizeLocal(
  familyCode: string,
  speciesId: string,
  variant: CreatureVariant,
): Promise<void> {
  const existing = readAll(familyCode);
  const addition: CollectedPrizeDoc = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    speciesId,
    variant,
    obtainedAt: Date.now(),
  };
  writeAll(familyCode, [...existing, addition]);
}
