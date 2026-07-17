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

const ALLOWED_PUNCTUATION = new Set(["，", "。", "！", "？", "、"]);

const SYSTEM_PROMPT =
  "你是一位幫五歲小朋友出中文練習句子的老師。使用者會提供一份「允許用字清單」（小朋友已經學會的國字）" +
  "和一個「目標字或詞」。嚴格遵守漢字限制：除了目標字或詞以外，句子裡的每一個國字都必須來自允許用字" +
  "清單，絕對不能出現清單以外的任何國字，也不可以使用注音、拼音或英文字母。標點符號不受用字清單限制，" +
  "可以正常使用「，。！？、」這幾種標點來讓句子更自然、更有語氣，但不要使用這幾種以外的其他符號。" +
  "每一句都必須完整包含使用者指定的「目標字或詞」（原字原順序，不能拆開）。" +
  "在造句之前，請先在心裡做「目標字詞彙探索」：如果目標是單一個字，請思考這個字能不能跟允許用字" +
  "清單裡的其他字組成自然、常用、意思正確的詞語（例如目標字是「愛」，字庫裡有「可」「好」「笑」" +
  "「玩」時，可以組成「可愛」「愛好」「愛笑」「愛玩」「好愛」等詞）。同樣的字換不同順序排列，" +
  "可能是完全不同的詞，意思和詞性也不一樣，不可以隨意拆解或倒裝湊詞：例如「愛好」通常是名詞" +
  "（表示興趣，如「我的愛好是看書」）或動詞（表示喜愛某事物），「好愛」是口語裡「好＋愛」表示" +
  "非常喜愛，跟「愛好」不是同一個詞、不能互換；「可愛」是一個完整的形容詞，不能因為「可」「愛」" +
  "都在字庫裡就任意重組或誤用意思。探索的順序是：先列出目標字能組成的常用詞，判斷每個詞正確的" +
  "字序、詞性和意思，再挑選適合五歲小孩、自然常用的詞語來造句；只有在組成該詞所需要的每一個字" +
  "都同時存在於允許用字清單（或就是目標字本身）時，才可以使用這個詞，絕對不能為了追求變化而" +
  "發明不存在、不自然或意思錯誤的詞。如果目標本身就是一個詞（例如「毛毛蟲」），就直接把這個詞" +
  "自然地用進句子裡，不需要再拆解成單字重組。" +
  "不要為了遵守字庫限制而只生成極度簡單的句子：像「我愛媽媽。」「我愛小狗。」這種單純" +
  "「主詞＋動詞＋受詞」的句型應該盡量避免。請在允許用字清單許可的範圍內，優先創作自然、完整、" +
  "有情境、有內容的句子：可以善用人物、動作、時間、地點、狀態、前後因果等描述方式增加句子的豐富度，" +
  "也可以適度使用較長的句子或複句（例如「也」「和」「可是」「一起」「在」「的」「有」「沒有」" +
  "「來」「去」這類常見字如果在允許用字清單裡，就可以拿來組合出更完整的語意）。這一批句子彼此之間" +
  "應盡量使用不同的句型與不同的情境，也應盡量呈現目標字（或目標字組成的詞）的不同用法與詞性，" +
  "不要每一句都用同一種句型、同一種詞性，或每一句都只是把目標字單獨當動詞用（例如不要五句都是" +
  "「我愛……」）。舉例來說，如果目標字是「愛」，五句可以分別涵蓋：「愛」單獨當動詞、組成" +
  "「可愛」這樣的形容詞、組成「愛好」這樣的名詞或動詞、「愛笑」「愛玩」這類習慣性用法、「好愛」" +
  "這種自然口語說法——但同樣要遵守前面的規則，只有在組成該詞的字都在允許用字清單裡時才能使用。" +
  "也不要只是替換掉同一個句型裡的人物或名詞（例如不要連續產生「我愛媽媽」「我愛爸爸」「我愛妹妹」" +
  "這種只換名詞、詞性完全相同的句子）。句子要讀起來像繪本裡自然的句子，生活化、" +
  "口語、符合五歲小孩的理解程度。請務必遵守使用者指定的句子長度要求（長度只計算國字數，不含標點符號）。" +
  "使用繁體中文（台灣用語）。" +
  "最重要的一點：每一句都必須是文法完全正確、通順自然、母語者會真的這樣說的中文句子，" +
  "絕對不能為了塞進允許用字或湊長度，硬把幾個字堆疊成不通順的句子。例如「晚上的狗在叫聲」文法" +
  "是錯的（「在叫」是動詞用法，「叫聲」是名詞用法，兩個不能這樣接在一起），正確應該寫成" +
  "「晚上的狗在叫」或「我聽到狗的叫聲」這種通順的說法。生成每一句之後，請在心裡逐字檢查一次：" +
  "這句話裡的每一個國字是不是都在目標字詞或允許用字清單裡？句子裡用到的每個詞語字序、詞性、意思" +
  "都正確嗎？文法對嗎？一個中文母語者會這樣說嗎？如果有任何一點不符合，就換一個字詞組合或句型" +
  "重新造句，直到完全符合為止，寧可句子簡單一點，也不要出現未學過的字、詞不成義或文法問題。" +
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

// Every Han character must come from the allowed set; punctuation is exempt
// from the allowed set but must still be one of the whitelisted marks (this
// also still rejects pinyin/zhuyin/English letters, matching the old rule).
function sentenceViolations(sentence: string, allowedSet: Set<string>): string[] {
  const violations: string[] = [];
  for (const ch of sentence) {
    if (isHanChar(ch)) {
      if (!allowedSet.has(ch)) violations.push(ch);
    } else if (!ALLOWED_PUNCTUATION.has(ch)) {
      violations.push(ch);
    }
  }
  return violations;
}

// Length limits are calibrated against Han-character count, so punctuation
// (now allowed) shouldn't count toward them.
function hanLength(sentence: string): number {
  return [...sentence].filter(isHanChar).length;
}

const MAX_ATTEMPTS = 3;

type OpenAIResult = { ok: true; sentences: unknown[] } | { ok: false; status: number; error: string };

async function callOpenAI(env: Env, userPrompt: string): Promise<OpenAIResult> {
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
    return { ok: false, status: 502, error: "AI 服務連線失敗" };
  }

  if (!openaiRes.ok) {
    return { ok: false, status: 502, error: "AI 服務暫時無法使用" };
  }

  const data = (await openaiRes.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content ?? "";

  try {
    const parsed = JSON.parse(content);
    return { ok: true, sentences: Array.isArray(parsed.sentences) ? parsed.sentences : [] };
  } catch {
    return { ok: true, sentences: [] };
  }
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

    const [minLen, maxLen] = DIFFICULTY_LENGTH_RANGE[difficulty];

    // Deterministic validation + retry loop: the AI's own self-check in the
    // prompt is a best-effort instruction, not a guarantee, so every returned
    // sentence is re-checked character-by-character here. Sentences with a
    // disallowed Han character are never shown to the user; instead they're
    // fed back to the AI (with the specific offending characters) so it can
    // retry, up to MAX_ATTEMPTS total calls.
    const collected: string[] = [];
    let retryFeedback = "";

    for (let attempt = 0; attempt < MAX_ATTEMPTS && collected.length < count; attempt++) {
      const remaining = count - collected.length;
      const requestCount = remaining + GENERATION_BUFFER[difficulty];

      const userPrompt =
        `允許用字清單（只能用這些字，不可以用清單以外的任何國字；標點符號不受此清單限制，` +
        `可另外使用「，。！？、」）：\n${allowedListText}\n\n` +
        `目標字或詞（每一句都必須完整包含這個字或詞，盡量跟其他允許用字組成有意義的詞語或句子）：${targetText}\n\n` +
        focusHint +
        referenceHint +
        `句子長度要求：${DIFFICULTY_GUIDANCE[difficulty]}（只計算國字數，標點符號不算在內）\n\n` +
        retryFeedback +
        `請生成 ${requestCount} 個句子，輸出 JSON：{"sentences": ["句子1", "句子2", ...]}`;

      const result = await callOpenAI(env, userPrompt);
      if (!result.ok) {
        if (collected.length > 0) break;
        return jsonResponse({ error: result.error }, result.status, headers);
      }

      const invalidSamples: { sentence: string; violations: string[] }[] = [];

      for (const raw of result.sentences) {
        if (collected.length >= count) break;
        if (typeof raw !== "string" || raw.length === 0) continue;
        if (collected.includes(raw)) continue;
        if (!raw.includes(targetText)) continue;

        const violations = sentenceViolations(raw, allowedSet);
        const len = hanLength(raw);
        const lengthOk = len >= minLen && len <= maxLen;

        if (violations.length === 0 && lengthOk) {
          collected.push(raw);
        } else if (violations.length > 0 && invalidSamples.length < 5) {
          invalidSamples.push({ sentence: raw, violations: [...new Set(violations)] });
        }
      }

      if (collected.length >= count || invalidSamples.length === 0) {
        retryFeedback = "";
      } else {
        const examples = invalidSamples
          .map((s) => `「${s.sentence}」（不允許的字：${s.violations.join("、")}）`)
          .join("\n");
        retryFeedback =
          `上一輪你產生的句子中，以下句子使用了不在允許用字清單裡的國字，請不要再犯同樣的錯誤，` +
          `重新造句時務必逐字確認每一個國字都在允許用字清單或目標字詞裡，只有標點符號可以例外：\n${examples}\n\n`;
      }
    }

    return jsonResponse({ sentences: collected.slice(0, count) }, 200, headers);
  },
};
