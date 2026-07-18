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
