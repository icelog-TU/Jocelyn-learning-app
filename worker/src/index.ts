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

// Longer (harder) sentences are far more likely to need a character outside
// the child's allowed-character list, so a much larger fraction gets
// rejected by the allowedSet filter below. Ask for a bigger raw batch on
// harder difficulties so enough survive filtering to reach `count`.
const GENERATION_BUFFER: Record<Difficulty, number> = {
  easy: 3,
  medium: 5,
  hard: 12,
};

const SYSTEM_PROMPT =
  "你是一位幫五歲小朋友出中文練習句子的老師。只能使用使用者提供的「允許用字清單」裡的國字來造句，" +
  "絕對不能出現清單以外的任何國字，也不可以使用標點符號、注音、拼音或英文字母，只能是純中文字。" +
  "每一句都必須完整包含使用者指定的「目標字或詞」（原字原順序，不能拆開）。請盡量把目標字或詞跟" +
  "「允許用字清單」裡小朋友已經學過的其他字組成真正有意義的詞語或句子（例如目標是「學」，可以組成" +
  "「學校」「學生」「學會」「好學」；如果目標本身就是一個詞，例如「毛毛蟲」，就直接把這個詞自然地" +
  "用在句子裡），讓句子讀起來像繪本裡自然的句子，不要把目標孤立地硬塞進句子。句子要生活化、口語、" +
  "符合五歲小孩的理解程度。請務必遵守使用者指定的句子長度要求。使用繁體中文（台灣用語）。" +
  "最重要的一點：每一句都必須是文法完全正確、通順自然、母語者會真的這樣說的中文句子，" +
  "絕對不能為了塞進允許用字或湊長度，硬把幾個字堆疊成不通順的句子。例如「晚上的狗在叫聲」文法" +
  "是錯的（「在叫」是動詞用法，「叫聲」是名詞用法，兩個不能這樣接在一起），正確應該寫成" +
  "「晚上的狗在叫」或「我聽到狗的叫聲」這種通順的說法。生成每一句之後，請在心裡檢查一次：" +
  "這句話文法對嗎？一個中文母語者會這樣說嗎？如果不通順，就換一個字詞組合或句型，直到通順為止，" +
  "寧可句子簡單一點，也不要文法有問題。" +
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
  focusChars?: unknown;
  referenceSentences?: unknown;
}

const MAX_TARGET_LENGTH = 6;
const MAX_FOCUS_CHARS = 15;
const MAX_REFERENCE_SENTENCES = 5;
const MAX_REFERENCE_LENGTH = 30;

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
    const focusChars = Array.isArray(body.focusChars)
      ? body.focusChars
          .filter((c): c is string => typeof c === "string" && c.length === 1 && isHanChar(c))
          .filter((c) => c !== targetText)
          .slice(0, MAX_FOCUS_CHARS)
      : [];
    const referenceSentences = Array.isArray(body.referenceSentences)
      ? body.referenceSentences
          .filter((s): s is string => typeof s === "string" && s.length > 0 && s.length <= MAX_REFERENCE_LENGTH)
          .slice(0, MAX_REFERENCE_SENTENCES)
      : [];

    if (knownChars.length === 0 || !targetText) {
      return jsonResponse({ sentences: [] }, 200, headers);
    }

    const allowedSet = new Set([...knownChars, ...targetChars, ...focusChars, ...GRAMMAR_WHITELIST]);
    const allowedListText = [...allowedSet].join("");

    const focusHint =
      focusChars.length > 0
        ? `加強練習字（如果可以自然地把其中一個或幾個字組合成有意義的詞用進句子裡，就儘量用進去，` +
          `例如「相」「信」在一起可以自然地寫成「相信」；不用每一句都用到，也不用勉強湊，能自然用上就用）：` +
          `${focusChars.join(" ")}\n\n`
        : "";

    const referenceHint =
      referenceSentences.length > 0
        ? `這位家長之前針對「${targetText}」寫過或修改過以下例句，家長認為這些例句比較自然道地，` +
          `請參考這些例句的用字風格、詞語搭配方式來造句（不用照抄，也不用每句都模仿，但盡量學習類似的` +
          `自然表達方式，避免出現跟這些例句風格差很多的生硬組合）：\n${referenceSentences.join("\n")}\n\n`
        : "";

    const userPrompt =
      `允許用字清單（只能用這些字，不可以用清單以外的任何國字）：\n${allowedListText}\n\n` +
      `目標字或詞（每一句都必須完整包含這個字或詞，盡量跟其他允許用字組成有意義的詞語或句子）：${targetText}\n\n` +
      focusHint +
      referenceHint +
      `句子長度要求：${DIFFICULTY_GUIDANCE[difficulty]}\n\n` +
      `請生成 ${count + GENERATION_BUFFER[difficulty]} 個句子，輸出 JSON：{"sentences": ["句子1", "句子2", ...]}`;

    let openaiRes: Response;
    try {
      openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.6,
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
