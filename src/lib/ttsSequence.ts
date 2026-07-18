export interface SpeakSequenceOptions {
  rate?: number;
  pitch?: number;
  /** Called exactly when a given part (by its index into `parts`) starts
   * being spoken — lets a caller highlight it in sync with playback,
   * without guessing at timing. */
  onCharStart?: (index: number) => void;
}

export interface SpeakSequenceHandle {
  /** Resolves once every part has finished playing (or the browser has no
   * speech synthesis support, in which case it resolves immediately). */
  done: Promise<void>;
  /** Stops playback immediately without letting `done` hang forever. Safe
   * to call after it has already finished. */
  cancel: () => void;
}

/** Speaks a list of strings in order — typically single characters, so a
 * caller can highlight each one as it's read aloud (karaoke-style), via
 * `onCharStart` firing on that character's own utterance's real `onstart`
 * event. Every part gets its own utterance (needed for that per-character
 * sync to be reliable at all — a single utterance for the whole sentence
 * would need the browser's `boundary` event to know where it is mid-speech,
 * and that event turned out to be unsupported/unreliable enough in practice
 * that it produced a much worse result: audio would start playing the full
 * sentence fluently, then get abruptly cut off and restarted from scratch,
 * slowly, the moment the highlight-sync fallback kicked in).
 *
 * All utterances are queued with `speechSynthesis.speak()` up front, back
 * to back, rather than waiting for each one's `onend` before queuing the
 * next. That removes every artificial gap this code itself would otherwise
 * add between characters (a JS round-trip, or worse, an explicit pause) —
 * what's left is only whatever minimal transition the browser's own speech
 * engine takes between two queued utterances, which is as close to gapless
 * as the Web Speech API allows for a still-reliable per-character highlight. */
export function speakSequence(parts: string[], options: SpeakSequenceOptions = {}): SpeakSequenceHandle {
  const { rate = 0.85, pitch = 1, onCharStart } = options;
  let cancelled = false;
  let resolveDone!: () => void;
  const done = new Promise<void>((resolve) => {
    resolveDone = resolve;
  });

  if (!("speechSynthesis" in window) || parts.length === 0) {
    resolveDone();
    return { done, cancel: () => {} };
  }
  window.speechSynthesis.cancel();

  let completedCount = 0;
  function onOneSettled() {
    completedCount += 1;
    if (completedCount === parts.length && !cancelled) resolveDone();
  }

  parts.forEach((part, index) => {
    const utterance = new SpeechSynthesisUtterance(part);
    utterance.lang = "zh-TW";
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.onstart = () => onCharStart?.(index);
    utterance.onend = onOneSettled;
    // Some engines fire "error" (e.g. interrupted by a cancel()) instead of
    // "end" — treat it the same as settling, so `done` never hangs.
    utterance.onerror = onOneSettled;
    window.speechSynthesis.speak(utterance);
  });

  return {
    done,
    cancel: () => {
      cancelled = true;
      window.speechSynthesis.cancel();
    },
  };
}
