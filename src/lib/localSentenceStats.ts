import type { SentenceStats } from "../types";

const EMPTY_STATS: SentenceStats = {
  totalStars: 0,
  totalSessions: 0,
  lastPracticedAt: null,
};

function storageKey(familyCode: string): string {
  return `hanzi-local-sentence-stats-${familyCode}`;
}

function readStats(familyCode: string): SentenceStats {
  try {
    const raw = localStorage.getItem(storageKey(familyCode));
    return raw ? (JSON.parse(raw) as SentenceStats) : EMPTY_STATS;
  } catch {
    return EMPTY_STATS;
  }
}

function writeStats(familyCode: string, stats: SentenceStats): void {
  localStorage.setItem(storageKey(familyCode), JSON.stringify(stats));
  window.dispatchEvent(new CustomEvent("local-sentence-stats-changed", { detail: familyCode }));
}

export function subscribeSentenceStatsLocal(
  familyCode: string,
  onChange: (stats: SentenceStats) => void,
): () => void {
  const emit = () => onChange(readStats(familyCode));
  emit();

  const handler = (e: Event) => {
    const detail = (e as CustomEvent<string>).detail;
    if (detail === familyCode) emit();
  };
  window.addEventListener("local-sentence-stats-changed", handler);
  window.addEventListener("storage", emit);

  return () => {
    window.removeEventListener("local-sentence-stats-changed", handler);
    window.removeEventListener("storage", emit);
  };
}

export async function recordSentenceSessionLocal(
  familyCode: string,
  starsEarned: number,
): Promise<void> {
  const current = readStats(familyCode);
  writeStats(familyCode, {
    totalStars: current.totalStars + starsEarned,
    totalSessions: current.totalSessions + 1,
    lastPracticedAt: Date.now(),
  });
}
