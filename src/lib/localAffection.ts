import { prizeKey } from "./gachaCatalog";
import type { AffectionDoc, CreatureVariant } from "../types";

function storageKey(familyCode: string): string {
  return `hanzi-local-affection-${familyCode}`;
}

function readAll(familyCode: string): AffectionDoc[] {
  try {
    const raw = localStorage.getItem(storageKey(familyCode));
    return raw ? (JSON.parse(raw) as AffectionDoc[]) : [];
  } catch {
    return [];
  }
}

function writeAll(familyCode: string, affection: AffectionDoc[]): void {
  localStorage.setItem(storageKey(familyCode), JSON.stringify(affection));
  window.dispatchEvent(new CustomEvent("local-affection-changed", { detail: familyCode }));
}

export function subscribeAffectionLocal(
  familyCode: string,
  onChange: (affection: AffectionDoc[]) => void,
): () => void {
  const emit = () => onChange(readAll(familyCode));
  emit();

  const handler = (e: Event) => {
    const detail = (e as CustomEvent<string>).detail;
    if (detail === familyCode) emit();
  };
  window.addEventListener("local-affection-changed", handler);
  window.addEventListener("storage", emit);

  return () => {
    window.removeEventListener("local-affection-changed", handler);
    window.removeEventListener("storage", emit);
  };
}

export async function giftToCreatureLocal(
  familyCode: string,
  speciesId: string,
  variant: CreatureVariant,
  hearts: number,
  starsCost: number,
): Promise<void> {
  const key = prizeKey(speciesId, variant);
  const existing = readAll(familyCode);
  const current = existing.find((a) => a.id === key);
  const updated: AffectionDoc = current
    ? { ...current, hearts: current.hearts + hearts, starsSpent: current.starsSpent + starsCost, updatedAt: Date.now() }
    : { id: key, speciesId, variant, hearts, starsSpent: starsCost, updatedAt: Date.now() };
  writeAll(familyCode, [...existing.filter((a) => a.id !== key), updated]);
}
