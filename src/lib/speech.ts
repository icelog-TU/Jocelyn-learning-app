export interface SpeakOptions {
  rate?: number;
  pitch?: number;
}

/** Reads text aloud with the Web Speech API, synthesized so no audio asset
 * needs to be shipped. No-ops silently where unsupported. */
export function speak(text: string, opts: SpeakOptions = {}): void {
  if (!("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-TW";
  utterance.rate = opts.rate ?? 0.85;
  utterance.pitch = opts.pitch ?? 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}
