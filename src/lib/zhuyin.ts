import { pinyin, polyphonic } from "pinyin-pro";
import { pinyinToZhuyin } from "pinyin-zhuyin";

function pinyinSyllableToZhuyin(syllable: string): string {
  try {
    return pinyinToZhuyin(syllable) || syllable;
  } catch {
    return syllable;
  }
}

/** Best-guess zhuyin for a hanzi string, joined with spaces per character. */
export function guessZhuyin(hanzi: string): string {
  const syllables = pinyin(hanzi, { toneType: "symbol", type: "array" });
  return syllables.map(pinyinSyllableToZhuyin).join(" ");
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
    zhuyin: pinyinSyllableToZhuyin(syllables[i] ?? char),
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
