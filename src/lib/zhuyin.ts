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
