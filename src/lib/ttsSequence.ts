export interface SpeakSequenceOptions {
  rate?: number;
  pitch?: number;
  /** Called exactly when a given part (by its index into `parts`) starts
   * being spoken — lets a caller highlight it in sync with playback,
   * without guessing at timing. */
  onCharStart?: (index: number) => void;
  /** Extra pause between parts, ms — only used by the per-character
   * fallback path (see below); the primary single-utterance path has no
   * artificial gaps at all, since it's one continuous utterance. */
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

/** How long to wait after speech visibly starts for at least one native
 * `boundary` event before concluding this engine doesn't fire them at all
 * and falling back to the slower per-character method — generous enough
 * that a slow-starting engine isn't mistaken for "unsupported", short
 * enough that a genuinely unsupported engine doesn't leave her waiting on a
 * frozen highlight. */
const BOUNDARY_FALLBACK_GRACE_MS = 500;

/** Speaks a list of strings in order — typically single characters, so a
 * caller can highlight each one as it's read aloud (karaoke-style).
 *
 * For a multi-part call with `onCharStart`, this speaks the whole thing as
 * ONE utterance and drives the highlight off the browser's native
 * `boundary` events, rather than chaining one utterance per character.
 * Chaining used to be the only approach here, but on some devices/engines
 * the per-utterance startup overhead is large enough that it compounds
 * with sentence length into an unbearable "one character... pause... one
 * character... pause" — exactly what made longer sentences impractical to
 * practice. A single utterance has none of that overhead and simply sounds
 * like natural continuous speech.
 *
 * `boundary` event support/granularity isn't universal, though, so if none
 * arrives shortly after speech starts, this automatically falls back to
 * the old chained-per-utterance method (reliable everywhere, just slower)
 * instead of leaving the highlight frozen for the whole sentence. Single-
 * part calls (most spoken prompts, which don't need per-character sync at
 * all) always use the simple chained path directly. */
export function speakSequence(parts: string[], options: SpeakSequenceOptions = {}): SpeakSequenceHandle {
  const { rate = 0.85, pitch = 1, onCharStart, gapMs = 150 } = options;
  let cancelled = false;
  let resolveDone!: () => void;
  const done = new Promise<void>((resolve) => {
    resolveDone = resolve;
  });

  function finish() {
    resolveDone();
  }

  if (!("speechSynthesis" in window) || parts.length === 0) {
    finish();
    return { done, cancel: () => {} };
  }
  window.speechSynthesis.cancel();

  function speakChained() {
    let i = 0;
    function speakNext() {
      if (cancelled || i >= parts.length) {
        finish();
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
          finish();
        } else if (gapMs > 0) {
          window.setTimeout(speakNext, gapMs);
        } else {
          speakNext();
        }
      };
      // Some engines fire "error" (e.g. interrupted by a cancel()) instead
      // of "end" — treat it the same as finishing, so `done` never hangs.
      utterance.onerror = () => finish();
      window.speechSynthesis.speak(utterance);
    }
    speakNext();
  }

  function cancelAll() {
    cancelled = true;
    window.speechSynthesis.cancel();
  }

  if (parts.length === 1 || !onCharStart) {
    speakChained();
    return { done, cancel: cancelAll };
  }

  // Maps a `boundary` event's charIndex (an offset into the joined text)
  // back to which part of `parts` it falls in.
  const offsets: number[] = [];
  let acc = 0;
  for (const part of parts) {
    offsets.push(acc);
    acc += part.length;
  }
  function offsetToPartIndex(charIndex: number): number {
    let idx = 0;
    for (let i = 0; i < offsets.length; i++) {
      if (offsets[i] > charIndex) break;
      idx = i;
    }
    return idx;
  }

  const utterance = new SpeechSynthesisUtterance(parts.join(""));
  utterance.lang = "zh-TW";
  utterance.rate = rate;
  utterance.pitch = pitch;

  let gotBoundary = false;
  let lastFired = -1;
  let fallbackTimer: number | null = null;
  let fallbackTriggered = false;

  function fireUpTo(index: number) {
    if (index <= lastFired) return;
    lastFired = index;
    onCharStart?.(index);
  }
  function clearFallbackTimer() {
    if (fallbackTimer !== null) {
      window.clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }
  }

  utterance.onboundary = (event) => {
    gotBoundary = true;
    clearFallbackTimer();
    fireUpTo(offsetToPartIndex(event.charIndex ?? 0));
  };
  utterance.onstart = () => {
    fireUpTo(0);
    fallbackTimer = window.setTimeout(() => {
      fallbackTimer = null;
      if (cancelled || gotBoundary) return;
      // This engine never told us where it is mid-sentence — abandon the
      // single-utterance attempt and fall back to the reliable
      // per-character chain rather than leave the highlight stuck on the
      // first character for the whole sentence.
      fallbackTriggered = true;
      window.speechSynthesis.cancel();
      speakChained();
    }, BOUNDARY_FALLBACK_GRACE_MS);
  };
  utterance.onend = () => {
    clearFallbackTimer();
    if (!fallbackTriggered) finish();
  };
  utterance.onerror = () => {
    clearFallbackTimer();
    // If the fallback already kicked in, this "error" is just this
    // utterance's own cancel() taking effect — speakChained() is now
    // running and owns resolving `done`, not us.
    if (!fallbackTriggered) finish();
  };

  window.speechSynthesis.speak(utterance);

  return {
    done,
    cancel: () => {
      clearFallbackTimer();
      cancelAll();
    },
  };
}
