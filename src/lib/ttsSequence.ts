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
/** Speech rate is inversely proportional to spoken duration, so dividing by
 * 0.75 here — rather than just picking a bigger rate number — makes the
 * intent explicit: each character now takes about 75% as long to say as
 * the previous 0.85 default did. */
export const DEFAULT_RATE = 0.85 / 0.75;

/** Extra multiplier applied on top of a base rate specifically for
 * highlighted/karaoke-style reading (a full sentence read one character at a
 * time with `onCharStart` driving the highlight) — kept separate from
 * DEFAULT_RATE because prompts/narration and this state have needed
 * different pacing before. It was doubled at one point (each character's
 * duration halved) based on a parent's own read of a demo, but her
 * 5-year-old actually using it found that too fast — real usage overruled
 * the earlier guess, so this is back to 1 (same pace as everything else).
 * The gaplessness between characters (see `speakSequence` below) is
 * unaffected either way — it comes from pre-queuing, not from rate. */
export const HIGHLIGHT_READING_RATE_MULTIPLIER = 1;

/** Drops punctuation (and anything else that isn't a Chinese character) from
 * a per-character reading sequence before it ever reaches `speakSequence`.
 * A lone punctuation mark handed to the speech engine as its own utterance
 * is unreliable on real devices — some engines silently skip it (never
 * firing `onstart`/`onend`) or otherwise mishandle it, which throws off the
 * 1:1 correspondence `speakSequence` relies on between an utterance's
 * `onstart` and its index, permanently desyncing every character's
 * highlight from its audio for the rest of the sentence. `indices` maps
 * each returned character back to its original position, so a caller can
 * still highlight the correct spot in the full (punctuation-included)
 * sentence. */
export function filterHanWithIndices(chars: string[]): { chars: string[]; indices: number[] } {
  const hanChars: string[] = [];
  const indices: number[] = [];
  chars.forEach((c, i) => {
    if (/\p{Script=Han}/u.test(c)) {
      hanChars.push(c);
      indices.push(i);
    }
  });
  return { chars: hanChars, indices };
}

export function speakSequence(parts: string[], options: SpeakSequenceOptions = {}): SpeakSequenceHandle {
  const { rate = DEFAULT_RATE, pitch = 1, onCharStart } = options;
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
  // Chrome (notably on Android) has a long-standing bug where the speech
  // queue can end up silently stuck in a "paused" state — e.g. after a tab
  // was backgrounded, or sometimes just after a cancel() — so newly queued
  // utterances sit there for a while before actually starting to play. That
  // would show up as exactly what got reported: gaps between characters
  // that come and go rather than a constant, predictable delay. `resume()`
  // is a harmless no-op when the queue isn't paused, so it's safe to call
  // unconditionally as a guard against that stuck state.
  window.speechSynthesis.resume();

  let fallbackTimer: number | null = null;
  function finish() {
    if (fallbackTimer !== null) {
      window.clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }
    resolveDone();
  }

  let completedCount = 0;
  function onOneSettled() {
    completedCount += 1;
    if (completedCount === parts.length && !cancelled) finish();
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

  // Safety net: on some devices the speech engine occasionally never fires
  // onstart/onend for one or more utterances at all (e.g. voices still
  // loading, a one-off engine hiccup) — with nothing else driving `done`,
  // that silently stranded whatever screen was waiting on it forever (the
  // reported symptom: a reading step that never finishes, no highlight, no
  // audio, and no way forward except "skip"). A per-character ceiling, generous
  // enough that real playback always finishes well before it fires, forces
  // the sequence to resolve anyway so the app can always make progress.
  const FALLBACK_MS_PER_PART = 3000;
  const FALLBACK_BASE_MS = 2000;
  fallbackTimer = window.setTimeout(() => {
    if (!cancelled) finish();
  }, parts.length * FALLBACK_MS_PER_PART + FALLBACK_BASE_MS);

  return {
    done,
    cancel: () => {
      cancelled = true;
      if (fallbackTimer !== null) window.clearTimeout(fallbackTimer);
      window.speechSynthesis.cancel();
    },
  };
}
