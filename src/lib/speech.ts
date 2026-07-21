export interface SpeakOptions {
  rate?: number;
  pitch?: number;
}

/** Reads text aloud with the Web Speech API, synthesized so no audio asset
 * needs to be shipped. No-ops silently where unsupported. */
export function speak(text: string, opts: SpeakOptions = {}): void {
  if (!("speechSynthesis" in window)) return;
  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-TW";
    utterance.rate = opts.rate ?? 0.85;
    utterance.pitch = opts.pitch ?? 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  } catch {
    // This is called inline from onClick handlers all over the app purely
    // for auditory feedback — on a device where cancel()/speak() itself
    // throws, letting that escape would abort whatever the button was
    // actually supposed to do (e.g. starting a review session) right
    // along with the narration. Losing the sound is fine; silently
    // breaking the button isn't.
  }
}
