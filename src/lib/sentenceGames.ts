/** Picks which character a "find it" / "fill in the blank" style game
 * should focus on: prefers the sentence's own target character (the one it
 * was generated to teach) so the game reinforces exactly what the day's
 * lesson is about, falling back to a random character from the sentence for
 * ones without a target (e.g. batch-imported sentences). */
export function pickTargetIndex(text: string, sourceChars: string[]): number | null {
  const chars = Array.from(text);
  const hanIndexes = chars.map((_, i) => i).filter((i) => /\p{Script=Han}/u.test(chars[i]));
  if (hanIndexes.length === 0) return null;
  const target = sourceChars[0];
  if (target) {
    const idx = hanIndexes.find((i) => chars[i] === target);
    if (idx !== undefined) return idx;
  }
  return hanIndexes[Math.floor(Math.random() * hanIndexes.length)];
}

export const ANIMAL_EMOJIS = ["🐶", "🐱", "🐰", "🐻", "🐼", "🦊", "🐵", "🐷", "🐸", "🐨"];

export function pickAnimalEmoji(): string {
  return ANIMAL_EMOJIS[Math.floor(Math.random() * ANIMAL_EMOJIS.length)];
}

/** Fisher-Yates shuffle — used both for the fill-blank game's answer order
 * and for the practice session's per-round game-mode "shuffle bag" (see
 * SentencePracticeSession), which guarantees every mode shows up once
 * before any of them repeats instead of relying on independent random picks
 * that can streak the same mode several times in a row. */
export function shuffled<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Generates up to `count` distinct "read it wrong" variants of a sentence
 * for the "誰念對了" game, each an adjacent-pair swap (occasionally two
 * swaps, for more scramble on longer sentences) of the correct character
 * order. Swapping (rather than substituting in a foreign character) keeps
 * every variant made of characters she already knows, and — crucially —
 * keeps the same length and 1:1 position correspondence as the original, so
 * the reference card can still highlight "index i" while a wrong reading
 * plays and have that be a meaningful, honest mismatch instead of nonsense. */
export function generateWrongVariants(correctChars: string[], count: number): string[][] {
  if (correctChars.length < 2) return [];

  function swapAt(chars: string[], i: number): string[] {
    const copy = [...chars];
    [copy[i], copy[i + 1]] = [copy[i + 1], copy[i]];
    return copy;
  }

  const seen = new Set([correctChars.join("")]);
  const variants: string[][] = [];
  let attempts = 0;
  while (variants.length < count && attempts < 50) {
    attempts++;
    const i = Math.floor(Math.random() * (correctChars.length - 1));
    let candidate = swapAt(correctChars, i);
    if (correctChars.length > 3 && Math.random() < 0.4) {
      const j = Math.floor(Math.random() * (correctChars.length - 1));
      candidate = swapAt(candidate, j);
    }
    const key = candidate.join("");
    if (!seen.has(key)) {
      seen.add(key);
      variants.push(candidate);
    }
  }
  // A very short sentence may not have `count` distinct permutations —
  // pad by repeating whatever we found rather than leaving the game short
  // of options (still playable, just with less variety that one time).
  while (variants.length > 0 && variants.length < count) {
    variants.push(variants[variants.length % variants.length]);
  }
  return variants;
}
