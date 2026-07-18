import type { CharacterDoc, SentenceDifficulty, SentenceDoc } from "../types";

export const isSentencePracticeConfigured = Boolean(import.meta.env.VITE_SENTENCE_API_URL);

export const DIFFICULTY_LABELS: Record<SentenceDifficulty, string> = {
  easy: "簡單",
  medium: "中等",
  hard: "困難",
};

export const DIFFICULTY_ORDER: SentenceDifficulty[] = ["easy", "medium", "hard"];

const STARS_BY_DIFFICULTY: Record<SentenceDifficulty, number> = {
  easy: 2,
  medium: 3,
  hard: 5,
};

/** Stars awarded for correctly reading a sentence of this difficulty —
 * harder (longer) sentences are worth more. Falls back to "medium" for
 * sentences saved before difficulty existed. */
export function starsForDifficulty(difficulty: SentenceDifficulty | undefined): number {
  return STARS_BY_DIFFICULTY[difficulty ?? "medium"];
}

/** Lifetime star total across all correct character and sentence reviews. */
export function computeTotalStars(characters: CharacterDoc[], sentences: SentenceDoc[]): number {
  const sentenceStars = sentences.reduce(
    (sum, s) => sum + s.stats.correctCount * starsForDifficulty(s.difficulty),
    0,
  );
  return characters.reduce((sum, c) => sum + c.stats.correctCount, 0) + sentenceStars;
}

/** The most recently-taught target characters/words (i.e. `sourceChars[0]`
 * of each day's generated batch), most recent first, capped at `limit`.
 * This is a pure view over `sentences` — nothing is deleted when a
 * character ages out past the limit, it just stops appearing here, while
 * its sentences stay fully intact in the regular history/management pages. */
export function recentTargetChars(sentences: SentenceDoc[], limit = 10): string[] {
  const latestByChar = new Map<string, number>();
  for (const s of sentences) {
    const char = s.sourceChars[0];
    if (!char) continue;
    const existing = latestByChar.get(char);
    if (existing === undefined || s.createdAt > existing) {
      latestByChar.set(char, s.createdAt);
    }
  }
  return [...latestByChar.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([char]) => char);
}

export async function generateSentences(
  knownChars: string[],
  targetText: string,
  difficulty: SentenceDifficulty,
  count: number,
  focusChars: string[] = [],
  referenceSentences: string[] = [],
): Promise<string[]> {
  const endpoint = import.meta.env.VITE_SENTENCE_API_URL;
  if (!endpoint) {
    throw new Error("尚未設定 AI 句子練習服務，請看 README 設定 Cloudflare Worker");
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ knownChars, targetText, difficulty, count, focusChars, referenceSentences }),
  });

  if (!res.ok) {
    throw new Error("AI 生成句子失敗，請稍後再試一次");
  }

  const data = (await res.json()) as { sentences?: unknown };
  return Array.isArray(data.sentences)
    ? data.sentences.filter((s): s is string => typeof s === "string")
    : [];
}
