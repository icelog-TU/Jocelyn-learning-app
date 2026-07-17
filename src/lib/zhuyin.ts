import { pinyin, polyphonic } from "pinyin-pro";
import { pinyinToZhuyin } from "pinyin-zhuyin";

function pinyinSyllableToZhuyin(syllable: string): string {
  try {
    return pinyinToZhuyin(syllable) || syllable;
  } catch {
    return syllable;
  }
}

function isHanChar(ch: string): boolean {
  return /\p{Script=Han}/u.test(ch);
}

interface PolyphoneOverride {
  /** Reading used when the character isn't part of any fixedWords match
   * below — the reading that's correct in the large majority of everyday
   * sentences. */
  fallback: string;
  /** Known fixed words that use a different reading than `fallback`,
   * checked against the surrounding text; `charIndex` is this character's
   * position within `word`. */
  fixedWords: {
    word: string;
    charIndex: number;
    zhuyin: string;
    /** Skip this match if the character right before `word` is one of
     * these — used when `word` is itself a substring of a longer, more
     * common phrase that needs the fallback reading instead (e.g. "種花"
     * as a verb is a fixedWord, but "一種花" is the classifier "種"
     * followed by "花" as an unrelated noun, not "to plant flowers"). */
    excludeIfPrecededBy?: string;
  }[];
}

/**
 * pinyin-pro's contextual disambiguation doesn't have real polyphone data
 * for some characters — it returns the same single reading regardless of
 * context. "著" is one of these: it's always resolved to "zhù" (as in
 * 著名/著作), even in sentences like "他笑著說" where the correct reading is
 * the neutral-tone continuous-aspect particle "zhe". Since that aspect-verb
 * usage is by far the most common one in everyday (and especially
 * child-level) sentences, override it directly here rather than trusting
 * the library, falling back to "zhe" except inside a short list of fixed
 * words that really do use one of 著's other readings.
 */
const POLYPHONE_OVERRIDES: Record<string, PolyphoneOverride> = {
  著: {
    fallback: "ㄓㄜ˙",
    fixedWords: [
      { word: "著名", charIndex: 0, zhuyin: "ㄓㄨˋ" },
      { word: "著作", charIndex: 0, zhuyin: "ㄓㄨˋ" },
      { word: "顯著", charIndex: 1, zhuyin: "ㄓㄨˋ" },
      { word: "土著", charIndex: 1, zhuyin: "ㄓㄨˋ" },
      { word: "著急", charIndex: 0, zhuyin: "ㄓㄠˊ" },
      { word: "著涼", charIndex: 0, zhuyin: "ㄓㄠˊ" },
      { word: "睡著", charIndex: 1, zhuyin: "ㄓㄠˊ" },
      { word: "找著", charIndex: 1, zhuyin: "ㄓㄠˊ" },
      { word: "著陸", charIndex: 0, zhuyin: "ㄓㄨㄛˊ" },
      { word: "著色", charIndex: 0, zhuyin: "ㄓㄨㄛˊ" },
    ],
  },
  // The characters below have the same problem as 著: pinyin-pro always
  // returns one fixed reading for them no matter the context, so their
  // fallback is set to whichever reading is correct in the more common
  // case, with the other reading listed as fixed-word exceptions.
  得: {
    fallback: "ㄉㄜ˙", // "V得..." degree/result particle: 跑得快、做得很好、笑得開心
    fixedWords: [
      { word: "得到", charIndex: 0, zhuyin: "ㄉㄜˊ" },
      { word: "獲得", charIndex: 1, zhuyin: "ㄉㄜˊ" },
      { word: "贏得", charIndex: 1, zhuyin: "ㄉㄜˊ" },
      { word: "取得", charIndex: 1, zhuyin: "ㄉㄜˊ" },
      { word: "得獎", charIndex: 0, zhuyin: "ㄉㄜˊ" },
      { word: "得意", charIndex: 0, zhuyin: "ㄉㄜˊ" },
      { word: "心得", charIndex: 1, zhuyin: "ㄉㄜˊ" },
      { word: "難得", charIndex: 1, zhuyin: "ㄉㄜˊ" },
      { word: "值得", charIndex: 1, zhuyin: "ㄉㄜˊ" },
    ],
  },
  還: {
    fallback: "ㄏㄞˊ", // 還好、還有、還是、還在、還沒
    fixedWords: [
      { word: "還書", charIndex: 0, zhuyin: "ㄏㄨㄢˊ" },
      { word: "還錢", charIndex: 0, zhuyin: "ㄏㄨㄢˊ" },
      { word: "還給", charIndex: 0, zhuyin: "ㄏㄨㄢˊ" },
      { word: "歸還", charIndex: 1, zhuyin: "ㄏㄨㄢˊ" },
      { word: "償還", charIndex: 1, zhuyin: "ㄏㄨㄢˊ" },
      { word: "退還", charIndex: 1, zhuyin: "ㄏㄨㄢˊ" },
    ],
  },
  幾: {
    fallback: "ㄐㄧˇ", // 幾個、幾點、幾歲、幾天、幾次
    // Note: "茶几" (the small table) is written with a different character,
    // 几, not 幾 — so it needs no entry here.
    fixedWords: [{ word: "幾乎", charIndex: 0, zhuyin: "ㄐㄧ" }],
  },
  長: {
    fallback: "ㄔㄤˊ", // 長長的、長度、長頸鹿、長城
    fixedWords: [
      { word: "長大", charIndex: 0, zhuyin: "ㄓㄤˇ" },
      { word: "成長", charIndex: 1, zhuyin: "ㄓㄤˇ" },
      { word: "生長", charIndex: 1, zhuyin: "ㄓㄤˇ" },
      { word: "長高", charIndex: 0, zhuyin: "ㄓㄤˇ" },
      { word: "校長", charIndex: 1, zhuyin: "ㄓㄤˇ" },
      { word: "家長", charIndex: 1, zhuyin: "ㄓㄤˇ" },
      { word: "班長", charIndex: 1, zhuyin: "ㄓㄤˇ" },
      { word: "隊長", charIndex: 1, zhuyin: "ㄓㄤˇ" },
      { word: "組長", charIndex: 1, zhuyin: "ㄓㄤˇ" },
      { word: "長輩", charIndex: 0, zhuyin: "ㄓㄤˇ" },
      { word: "長老", charIndex: 0, zhuyin: "ㄓㄤˇ" },
    ],
  },
  覺: {
    fallback: "ㄐㄩㄝˊ", // 覺得、感覺、發覺、知覺、警覺
    fixedWords: [
      { word: "睡覺", charIndex: 1, zhuyin: "ㄐㄧㄠˋ" },
      { word: "午覺", charIndex: 1, zhuyin: "ㄐㄧㄠˋ" },
      { word: "覺覺", charIndex: 0, zhuyin: "ㄐㄧㄠˋ" },
      { word: "覺覺", charIndex: 1, zhuyin: "ㄐㄧㄠˋ" },
    ],
  },
  教: {
    fallback: "ㄐㄧㄠˋ", // 教室、教育、教師、宗教、請教
    fixedWords: [
      { word: "教我", charIndex: 0, zhuyin: "ㄐㄧㄠ" },
      { word: "教你", charIndex: 0, zhuyin: "ㄐㄧㄠ" },
      { word: "教他", charIndex: 0, zhuyin: "ㄐㄧㄠ" },
      { word: "教她", charIndex: 0, zhuyin: "ㄐㄧㄠ" },
      { word: "教我們", charIndex: 0, zhuyin: "ㄐㄧㄠ" },
      { word: "教你們", charIndex: 0, zhuyin: "ㄐㄧㄠ" },
      { word: "教他們", charIndex: 0, zhuyin: "ㄐㄧㄠ" },
      { word: "教大家", charIndex: 0, zhuyin: "ㄐㄧㄠ" },
    ],
  },
  種: {
    fallback: "ㄓㄨㄥˇ", // 一種、這種、哪種、種類
    fixedWords: [
      // "種花/種菜/種樹/種田" as a verb (zhòng) look identical to the
      // classifier "種" (zhǒng) followed by an unrelated noun in phrases
      // like "一種花" ("a kind of flower") — excluded whenever preceded by
      // a classifier-triggering word so those keep the zhǒng fallback.
      { word: "種花", charIndex: 0, zhuyin: "ㄓㄨㄥˋ", excludeIfPrecededBy: "一二三四五六七八九十兩幾這那哪各每某百千萬" },
      { word: "種菜", charIndex: 0, zhuyin: "ㄓㄨㄥˋ", excludeIfPrecededBy: "一二三四五六七八九十兩幾這那哪各每某百千萬" },
      { word: "種樹", charIndex: 0, zhuyin: "ㄓㄨㄥˋ", excludeIfPrecededBy: "一二三四五六七八九十兩幾這那哪各每某百千萬" },
      { word: "種田", charIndex: 0, zhuyin: "ㄓㄨㄥˋ", excludeIfPrecededBy: "一二三四五六七八九十兩幾這那哪各每某百千萬" },
      { word: "栽種", charIndex: 1, zhuyin: "ㄓㄨㄥˋ" },
      { word: "耕種", charIndex: 1, zhuyin: "ㄓㄨㄥˋ" },
    ],
  },
  量: {
    fallback: "ㄌㄧㄤˋ", // 數量、重量、力量、分量、能量
    fixedWords: [
      { word: "量身高", charIndex: 0, zhuyin: "ㄌㄧㄤˊ" },
      { word: "量體重", charIndex: 0, zhuyin: "ㄌㄧㄤˊ" },
      { word: "量一量", charIndex: 0, zhuyin: "ㄌㄧㄤˊ" },
      { word: "量一量", charIndex: 2, zhuyin: "ㄌㄧㄤˊ" },
      { word: "測量", charIndex: 1, zhuyin: "ㄌㄧㄤˊ" },
      { word: "丈量", charIndex: 1, zhuyin: "ㄌㄧㄤˊ" },
      { word: "打量", charIndex: 1, zhuyin: "ㄌㄧㄤˊ" },
    ],
  },
  行: {
    fallback: "ㄒㄧㄥˊ", // 行、可以、旅行、進行、流行、不行
    fixedWords: [
      { word: "銀行", charIndex: 1, zhuyin: "ㄏㄤˊ" },
      { word: "行列", charIndex: 0, zhuyin: "ㄏㄤˊ" },
      { word: "內行", charIndex: 1, zhuyin: "ㄏㄤˊ" },
      { word: "外行", charIndex: 1, zhuyin: "ㄏㄤˊ" },
      { word: "同行", charIndex: 1, zhuyin: "ㄏㄤˊ" },
    ],
  },
  好: {
    fallback: "ㄏㄠˇ", // 很好、好吃、好玩
    fixedWords: [
      { word: "愛好", charIndex: 1, zhuyin: "ㄏㄠˋ" },
      { word: "好奇", charIndex: 0, zhuyin: "ㄏㄠˋ" },
      { word: "嗜好", charIndex: 1, zhuyin: "ㄏㄠˋ" },
      { word: "好客", charIndex: 0, zhuyin: "ㄏㄠˋ" },
    ],
  },
  空: {
    fallback: "ㄎㄨㄥ", // 天空、空氣、太空
    fixedWords: [
      { word: "空閒", charIndex: 0, zhuyin: "ㄎㄨㄥˋ" },
      { word: "有空", charIndex: 1, zhuyin: "ㄎㄨㄥˋ" },
      { word: "抽空", charIndex: 1, zhuyin: "ㄎㄨㄥˋ" },
      { word: "填空", charIndex: 1, zhuyin: "ㄎㄨㄥˋ" },
      { word: "空白", charIndex: 0, zhuyin: "ㄎㄨㄥˋ" },
    ],
  },
  中: {
    fallback: "ㄓㄨㄥ", // 中間、中午、中國、中文
    fixedWords: [
      { word: "中獎", charIndex: 0, zhuyin: "ㄓㄨㄥˋ" },
      { word: "中毒", charIndex: 0, zhuyin: "ㄓㄨㄥˋ" },
      { word: "猜中", charIndex: 1, zhuyin: "ㄓㄨㄥˋ" },
      { word: "看中", charIndex: 1, zhuyin: "ㄓㄨㄥˋ" },
      { word: "說中", charIndex: 1, zhuyin: "ㄓㄨㄥˋ" },
    ],
  },
  為: {
    fallback: "ㄨㄟˊ", // 以為、成為、認為、行為、作為
    fixedWords: [
      { word: "因為", charIndex: 1, zhuyin: "ㄨㄟˋ" },
      { word: "為了", charIndex: 0, zhuyin: "ㄨㄟˋ" },
      { word: "為什麼", charIndex: 0, zhuyin: "ㄨㄟˋ" },
      { word: "為何", charIndex: 0, zhuyin: "ㄨㄟˋ" },
    ],
  },
};

/** Returns an overridden zhuyin reading for `text[index]`, or null if this
 * character has no override registered (the normal pinyin-pro reading
 * should be used instead). */
function overriddenZhuyin(text: string, index: number, char: string): string | null {
  const override = POLYPHONE_OVERRIDES[char];
  if (!override) return null;
  for (const fixedWord of override.fixedWords) {
    const start = index - fixedWord.charIndex;
    if (start < 0 || text.slice(start, start + fixedWord.word.length) !== fixedWord.word) continue;
    if (fixedWord.excludeIfPrecededBy && start > 0 && fixedWord.excludeIfPrecededBy.includes(text[start - 1])) {
      continue;
    }
    return fixedWord.zhuyin;
  }
  return override.fallback;
}

/** Best-guess zhuyin for a hanzi string, joined with spaces per character. */
export function guessZhuyin(hanzi: string): string {
  const chars = Array.from(hanzi);
  const syllables = pinyin(hanzi, { toneType: "symbol", type: "array" });
  return chars
    .map((char, i) => overriddenZhuyin(hanzi, i, char) ?? pinyinSyllableToZhuyin(syllables[i] ?? char))
    .join(" ");
}

export interface AnnotatedChar {
  char: string;
  zhuyin: string;
}

/**
 * Per-character zhuyin for a full sentence, using pinyin-pro's contextual
 * word segmentation to disambiguate polyphonic characters (e.g. picks the
 * right reading of "了" based on surrounding words), unlike converting each
 * character in isolation.
 */
export function zhuyinForSentence(sentence: string): AnnotatedChar[] {
  const chars = Array.from(sentence);
  const syllables = pinyin(sentence, { toneType: "symbol", type: "array" });
  return chars.map((char, i) => ({
    char,
    // Punctuation has no reading, so leave the zhuyin line blank instead of
    // echoing the punctuation mark itself (pinyin-pro passes it through
    // unchanged, which would otherwise show it duplicated on both lines).
    zhuyin: isHanChar(char)
      ? (overriddenZhuyin(sentence, i, char) ?? pinyinSyllableToZhuyin(syllables[i] ?? char))
      : "",
  }));
}

/** For a single character, return alternate zhuyin readings (polyphonic support). */
export function zhuyinCandidates(char: string): string[] {
  if (char.length !== 1) return [guessZhuyin(char)];

  // polyphonic() returns one entry per character position; for a single
  // character that entry is a space-separated list of alternate readings
  // for that character (e.g. "了" -> "le liǎo"), not multiple syllables.
  const [readingsForChar] = polyphonic(char, { toneType: "symbol" });
  const seen = new Set<string>();
  const candidates: string[] = [];

  for (const syllable of (readingsForChar ?? "").split(" ").filter(Boolean)) {
    const zhuyin = pinyinSyllableToZhuyin(syllable);
    if (!seen.has(zhuyin)) {
      seen.add(zhuyin);
      candidates.push(zhuyin);
    }
  }

  if (candidates.length === 0) {
    candidates.push(guessZhuyin(char));
  }

  return candidates;
}
