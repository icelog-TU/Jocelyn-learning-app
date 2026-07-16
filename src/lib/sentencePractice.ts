export const isSentencePracticeConfigured = Boolean(import.meta.env.VITE_SENTENCE_API_URL);

/** Stars awarded per correctly-read sentence (more than a single character,
 * since a whole sentence is a bigger accomplishment). */
export const STARS_PER_SENTENCE = 3;

export async function generateSentences(
  knownChars: string[],
  targetChar: string,
  count: number,
): Promise<string[]> {
  const endpoint = import.meta.env.VITE_SENTENCE_API_URL;
  if (!endpoint) {
    throw new Error("尚未設定 AI 句子練習服務，請看 README 設定 Cloudflare Worker");
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ knownChars, targetChar, count }),
  });

  if (!res.ok) {
    throw new Error("AI 生成句子失敗，請稍後再試一次");
  }

  const data = (await res.json()) as { sentences?: unknown };
  return Array.isArray(data.sentences)
    ? data.sentences.filter((s): s is string => typeof s === "string")
    : [];
}
