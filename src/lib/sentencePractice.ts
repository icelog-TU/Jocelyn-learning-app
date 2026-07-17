import type { SentenceDifficulty } from "../types";

export const isSentencePracticeConfigured = Boolean(import.meta.env.VITE_SENTENCE_API_URL);

export const DIFFICULTY_LABELS: Record<SentenceDifficulty, string> = {
  easy: "簡單",
  medium: "中等",
  hard: "困難",
};

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

export async function generateSentences(
  knownChars: string[],
  targetText: string,
  difficulty: SentenceDifficulty,
  count: number,
  focusChars: string[] = [],
): Promise<string[]> {
  const endpoint = import.meta.env.VITE_SENTENCE_API_URL;
  if (!endpoint) {
    throw new Error("尚未設定 AI 句子練習服務，請看 README 設定 Cloudflare Worker");
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ knownChars, targetText, difficulty, count, focusChars }),
  });

  if (!res.ok) {
    throw new Error("AI 生成句子失敗，請稍後再試一次");
  }

  const data = (await res.json()) as { sentences?: unknown };
  return Array.isArray(data.sentences)
    ? data.sentences.filter((s): s is string => typeof s === "string")
    : [];
}
