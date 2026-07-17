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
  fixedWords: { word: string; charIndex: number; zhuyin: string }[];
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
};

/** Returns an overridden zhuyin reading for `text[index]`, or null if this
 * character has no override registered (the normal pinyin-pro reading
 * should be used instead). */
function overriddenZhuyin(text: string, index: number, char: string): string | null {
  const override = POLYPHONE_OVERRIDES[char];
  if (!override) return null;
  for (const fixedWord of override.fixedWords) {
    const start = index - fixedWord.charIndex;
    if (start >= 0 && text.slice(start, start + fixedWord.word.length) === fixedWord.word) {
      return fixedWord.zhuyin;
    }
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
