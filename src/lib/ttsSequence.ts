export interface SpeakSequenceOptions {
  rate?: number;
  pitch?: number;
  /** Called exactly when a given part (by its index into `parts`) starts
   * being spoken — lets a caller highlight it in sync with playback,
   * without guessing at timing. */
  onCharStart?: (index: number) => void;
  /** Extra pause between parts, ms — the browser's own gap between
   * back-to-back utterances is too tight to feel like separate words. */
  gapMs?: number;
}

export interface SpeakSequenceHandle {
  /** Resolves once every part has finished playing (or the browser has no
   * speech synthesis support, in which case it resolves immediately). */
  done: Promise<void>;
  /** Stops playback immediately without letting `done` hang forever. Safe
   * to call after it has already finished. */
  cancel: () => void;
}

/** Speaks a list of strings one at a time, in order — typically single
 * characters, so a caller can highlight each one as it's read aloud
 * (karaoke-style). Relies on each utterance's real `onstart`/`onend` events
 * rather than an estimated duration, so the highlight stays in sync
 * regardless of how fast a given device's TTS engine actually talks. */
export function speakSequence(parts: string[], options: SpeakSequenceOptions = {}): SpeakSequenceHandle {
  const { rate = 0.85, pitch = 1, onCharStart, gapMs = 150 } = options;
  let cancelled = false;

  const done = new Promise<void>((resolve) => {
    if (!("speechSynthesis" in window) || parts.length === 0) {
      resolve();
      return;
    }
    window.speechSynthesis.cancel();

    let i = 0;
    function speakNext() {
      if (cancelled || i >= parts.length) {
        resolve();
        return;
      }
      const index = i;
      const utterance = new SpeechSynthesisUtterance(parts[index]);
      utterance.lang = "zh-TW";
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.onstart = () => onCharStart?.(index);
      utterance.onend = () => {
        i += 1;
        if (cancelled) {
          resolve();
        } else if (gapMs > 0) {
          window.setTimeout(speakNext, gapMs);
        } else {
          speakNext();
        }
      };
      // Some engines fire "error" (e.g. interrupted by a cancel()) instead
      // of "end" — treat it the same as finishing, so `done` never hangs.
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    }
    speakNext();
  });

  return {
    done,
    cancel: () => {
      cancelled = true;
      window.speechSynthesis.cancel();
    },
  };
}
