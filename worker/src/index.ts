import { GRAMMAR_WHITELIST } from "./grammarWhitelist";

export interface Env {
  OPENAI_API_KEY: string;
  ALLOWED_ORIGIN: string;
}

type Difficulty = "easy" | "medium" | "hard";

const DIFFICULTY_GUIDANCE: Record<Difficulty, string> = {
  easy: "句子要非常簡短簡單，長度大約 3 到 6 個字，只有一個簡單的意思。",
  medium: "句子長度大約 6 到 11 個字，可以是一個完整、生活化的句子。",
  hard: "句子長度大約 10 到 18 個字，可以是稍微複雜一點的句型（例如包含兩個短句、更多細節），但一樣只能使用允許用字清單裡的字。",
};

// Backstop length ranges matching DIFFICULTY_GUIDANCE, used to filter out
// sentences that ignore the length instruction (a little slack on both ends).
const DIFFICULTY_LENGTH_RANGE: Record<Difficulty, [number, number]> = {
  easy: [2, 7],
  medium: [5, 13],
  hard: [9, 22],
};

const SYSTEM_PROMPT =
  "你是一位幫五歲小朋友出中文練習句子的老師。只能使用使用者提供的「允許用字清單」裡的國字來造句，" +
  "絕對不能出現清單以外的任何國字，也不可以使用標點符號、注音、拼音或英文字母，只能是純中文字。" +
  "每一句都必須完整包含使用者指定的「目標字或詞」（原字原順序，不能拆開）。請盡量把目標字或詞跟" +
  "「允許用字清單」裡小朋友已經學過的其他字組成真正有意義的詞語或句子（例如目標是「學」，可以組成" +
  "「學校」「學生」「學會」「好學」；如果目標本身就是一個詞，例如「毛毛蟲」，就直接把這個詞自然地" +
  "用在句子裡），讓句子讀起來像繪本裡自然的句子，不要把目標孤立地硬塞進句子。句子要生活化、口語、" +
  "符合五歲小孩的理解程度。請務必遵守使用者指定的句子長度要求。使用繁體中文（台灣用語）。" +
  '請直接輸出 JSON，格式為 {"sentences": ["句子1", "句子2"]}，不要加任何其他文字或說明。';

function corsHeaders(allowedOrigin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

function jsonResponse(body: unknown, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

interface RequestBody {
  knownChars?: unknown;
  targetText?: unknown;
  difficulty?: unknown;
  count?: unknown;
}

const MAX_TARGET_LENGTH = 6;

function isHanChar(ch: string): boolean {
  return /\p{Script=Han}/u.test(ch);
}

function parseDifficulty(value: unknown): Difficulty {
  return value === "easy" || value === "medium" || value === "hard" ? value : "medium";
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const headers = corsHeaders(env.ALLOWED_ORIGIN);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405, headers);
    }

    const origin = request.headers.get("Origin") ?? "";
    if (origin !== env.ALLOWED_ORIGIN) {
      return jsonResponse({ error: "Forbidden" }, 403, headers);
    }

    let body: RequestBody;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "Bad request" }, 400, headers);
    }

    const knownChars = Array.isArray(body.knownChars)
      ? body.knownChars.filter((c): c is string => typeof c === "string" && c.length === 1)
      : [];
    const targetChars =
      typeof body.targetText === "string" ? [...body.targetText] : [];
    const targetText =
      targetChars.length >= 1 &&
      targetChars.length <= MAX_TARGET_LENGTH &&
      targetChars.every(isHanChar)
        ? body.targetText as string
        : null;
    const difficulty = parseDifficulty(body.difficulty);
    const count = Math.min(Math.max(Math.trunc(Number(body.count) || 5), 1), 10);

    if (knownChars.length === 0 || !targetText) {
      return jsonResponse({ sentences: [] }, 200, headers);
    }

    const allowedSet = new Set([...knownChars, ...targetChars, ...GRAMMAR_WHITELIST]);
    const allowedListText = [...allowedSet].join("");

    const userPrompt =
      `允許用字清單（只能用這些字，不可以用清單以外的任何國字）：\n${allowedListText}\n\n` +
      `目標字或詞（每一句都必須完整包含這個字或詞，盡量跟其他允許用字組成有意義的詞語或句子）：${targetText}\n\n` +
      `句子長度要求：${DIFFICULTY_GUIDANCE[difficulty]}\n\n` +
      `請生成 ${count + 3} 個句子，輸出 JSON：{"sentences": ["句子1", "句子2", ...]}`;

    let openaiRes: Response;
    try {
      openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.9,
        }),
      });
    } catch {
      return jsonResponse({ error: "AI 服務連線失敗" }, 502, headers);
    }

    if (!openaiRes.ok) {
      return jsonResponse({ error: "AI 服務暫時無法使用" }, 502, headers);
    }

    const data = (await openaiRes.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content ?? "";

    let rawSentences: unknown[] = [];
    try {
      const parsed = JSON.parse(content);
      rawSentences = Array.isArray(parsed.sentences) ? parsed.sentences : [];
    } catch {
      rawSentences = [];
    }

    const [minLen, maxLen] = DIFFICULTY_LENGTH_RANGE[difficulty];

    const validSentences = rawSentences
      .filter((s): s is string => typeof s === "string" && s.length > 0)
      .filter((s) => s.includes(targetText))
      .filter((s) => [...s].every((ch) => allowedSet.has(ch)))
      .filter((s) => {
        const len = [...s].length;
        return len >= minLen && len <= maxLen;
      })
      .slice(0, count);

    return jsonResponse({ sentences: validSentences }, 200, headers);
  },
};
