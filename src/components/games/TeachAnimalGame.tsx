import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { SentenceDoc } from "../../types";
import { SentenceCard } from "../SentenceCard";
import { useAudioRecorder } from "../../hooks/useAudioRecorder";
import {
  speakSequence,
  HIGHLIGHT_READING_RATE_MULTIPLIER,
  type SpeakSequenceHandle,
} from "../../lib/ttsSequence";
import { playAudioUrl } from "../../lib/audioPlayback";
import { playDingSound, playStarSound } from "../../lib/sound";
import { ANIMAL_NAMES, pickAnimalEmoji, pickTargetIndex } from "../../lib/sentenceGames";

interface Props {
  sentence: SentenceDoc;
  onComplete: () => void;
  onSkip: () => void;
}

/** Distinctly higher than the narrator voice used elsewhere, so it's
 * obviously "a different character talking" rather than the app's own
 * narration. Rate divided by 0.75 for the same reason as speakSequence's
 * own default — each character/word takes about 75% as long to say as the
 * original 0.95 rate did. */
const ANIMAL_VOICE = { pitch: 1.6, rate: 0.95 / 0.75 };

/** Same idea as ANIMAL_VOICE.rate but only for the highlighted, one-
 * character-at-a-time reading segments (`before`/`after` the missing
 * character) — she confirmed the animal's other lines (self-intro, asking,
 * praise, etc.) are already paced right and only the highlighted reading
 * itself needed to be roughly twice as fast. */
const ANIMAL_HIGHLIGHT_READING_RATE = ANIMAL_VOICE.rate * HIGHLIGHT_READING_RATE_MULTIPLIER;

/** Below this hold duration (ms), a press is almost certainly an accidental
 * tap-and-release rather than a real attempt to say the character out loud
 * — discard the (likely blank) recording and ask her to try again instead
 * of letting the animal "learn" from silence. */
const MIN_HOLD_MS = 500;

type Phase = "reading" | "recording" | "reciting";

/** Shared by every phase-text variant below (recording banner, priming
 * hint, default status) — same font size and a minHeight generous enough
 * for two lines, so text swaps between them never change this block's
 * rendered height. See the render section for why that stability matters. */
const PHASE_TEXT_STYLE: CSSProperties = {
  textAlign: "center",
  fontSize: "1.1rem",
  margin: "0 0 12px",
  minHeight: "2.8em",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

/** "教小動物" — role reversal: instead of the child being asked to perform,
 * a cartoon animal reads the sentence and gets stuck on one character,
 * asking HER to teach it. She presses and holds the stuck character itself
 * to record herself saying it (rather than a separate button, which tested
 * as unintuitive — the recording action now lives directly on the thing
 * being taught); the animal then "recites" the whole sentence again, using
 * her own recording spliced in for the word it learned. */
export function TeachAnimalGame({ sentence, onComplete, onSkip }: Props) {
  const chars = useMemo(() => Array.from(sentence.text), [sentence.text]);
  const missingIndex = useMemo(
    () => pickTargetIndex(sentence.text, sentence.sourceChars),
    [sentence.text, sentence.sourceChars],
  );
  const missingChar = missingIndex !== null ? chars[missingIndex] : null;
  // Safe with an empty deps array: SentencePracticeSession mounts a fresh
  // instance of this component per sentence (via `key={current.id}`), so
  // this only ever runs once per round anyway.
  const animal = useMemo(() => pickAnimalEmoji(), []);
  const animalName = ANIMAL_NAMES[animal] ?? "小動物";

  const [phase, setPhase] = useState<Phase>("reading");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [askingIndex, setAskingIndex] = useState<number | null>(null);
  const [foundIndex, setFoundIndex] = useState<number | null>(null);
  // True during the spoken "請幫忙唸出這個字" instruction that plays right
  // after she presses down and before the mic actually starts — without
  // this gap the only feedback on press was a bare beep, which a 5-year-old
  // has no way to interpret as "say the word now".
  const [priming, setPriming] = useState(false);
  const cancelledRef = useRef(false);
  const pressStartRef = useRef<number | null>(null);
  // Set if she lets go while the priming instruction is still playing (i.e.
  // before the mic ever actually started) — lets handleCharPressStart's
  // callback know not to start recording once the instruction finishes.
  const releasedDuringPrimeRef = useRef(false);

  const {
    state: recorderState,
    audioUrl,
    start: startRecording,
    stop: stopRecording,
    reset: resetRecording,
  } = useAudioRecorder(onSkip);

  useEffect(() => {
    if (missingIndex === null || missingChar === null) {
      onSkip();
      return;
    }

    cancelledRef.current = false;
    setPhase("reading");
    setActiveIndex(null);
    setAskingIndex(null);
    setFoundIndex(null);
    setPriming(false);
    releasedDuringPrimeRef.current = false;

    // A quick self-introduction before diving in — without it, the sentence
    // just started playing out of nowhere with no lead-in.
    const introSeq = speakSequence([`我是${animalName}，我要來唸這個句子囉！`], ANIMAL_VOICE);
    let readSeq: SpeakSequenceHandle | null = null;
    let askSeq: SpeakSequenceHandle | null = null;
    introSeq.done.then(() => {
      if (cancelledRef.current) return;
      const before = chars.slice(0, missingIndex);
      readSeq = speakSequence(before, {
        ...ANIMAL_VOICE,
        rate: ANIMAL_HIGHLIGHT_READING_RATE,
        onCharStart: setActiveIndex,
      });
      readSeq.done.then(() => {
        if (cancelledRef.current) return;
        setActiveIndex(null);
        setAskingIndex(missingIndex);
        // Deliberately never speaks the missing character itself — the whole
        // premise is "I don't know this one", so saying it out loud here
        // would contradict that. The on-screen text still names it visually.
        // "嗚嗚嗚" instead of a flat "嗯…" so the TTS reading actually sounds
        // upset/stuck rather than just a neutral filler sound.
        askSeq = speakSequence(
          ["嗚嗚嗚，這個字我不會念，你可以教我嗎？按住這個字，念給我聽吧！"],
          ANIMAL_VOICE,
        );
        askSeq.done.then(() => {
          if (!cancelledRef.current) setPhase("recording");
        });
      });
    });

    return () => {
      cancelledRef.current = true;
      introSeq.cancel();
      readSeq?.cancel();
      askSeq?.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentence.id]);

  // Fires once the press-and-hold recording finishes.
  useEffect(() => {
    if (phase !== "recording" || recorderState !== "recorded" || !audioUrl) return;
    const heldMs = pressStartRef.current === null ? Infinity : Date.now() - pressStartRef.current;
    if (heldMs < MIN_HOLD_MS) {
      // Almost certainly an accidental tap-and-release, not a real attempt
      // to say the word — discard the (likely blank) clip and ask again
      // rather than letting the animal "learn" from silence.
      resetRecording();
      speakSequence(["要按久一點，再念一次看看喔"], ANIMAL_VOICE);
      return;
    }
    handleRecorded(audioUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, recorderState, audioUrl]);

  function handleCharPressStart(index: number) {
    if (phase !== "recording" || index !== missingIndex || recorderState !== "idle" || priming) return;
    releasedDuringPrimeRef.current = false;
    setPriming(true);
    // Speak the instruction first, then a clear "叮" ding, THEN actually
    // start the mic — a bare beep on press told her something happened but
    // not what to do; the instruction now explicitly says to wait for the
    // ding, so the two cues read as one sequence instead of two unrelated
    // signals.
    const primeSeq = speakSequence(["聽到「叮」一聲後，請幫忙唸出這個字"], ANIMAL_VOICE);
    primeSeq.done.then(() => {
      if (cancelledRef.current) return;
      setPriming(false);
      if (releasedDuringPrimeRef.current) {
        // She let go before the mic ever started — nothing was recorded,
        // so just nudge her to hold through the ding and try again.
        speakSequence(["要按住喔，再試一次看看"], ANIMAL_VOICE);
        return;
      }
      playDingSound();
      pressStartRef.current = Date.now();
      startRecording();
    });
  }

  function handleCharPressEnd(index: number) {
    if (index !== missingIndex) return;
    if (priming) {
      releasedDuringPrimeRef.current = true;
      return;
    }
    if (phase !== "recording" || recorderState !== "recording") return;
    stopRecording();
  }

  function handleRecorded(url: string) {
    if (missingIndex === null) return;
    setPhase("reciting");
    setAskingIndex(null);
    setFoundIndex(missingIndex);

    const thanksSeq = speakSequence(["謝謝你教我！"], ANIMAL_VOICE);
    thanksSeq.done
      .then(() => {
        if (cancelledRef.current) return undefined;
        // A clear "here goes" line before the animal launches into the
        // sentence — without it, the recitation started abruptly right
        // after "謝謝你教我！" and was easy to miss the start of.
        const tryingSeq = speakSequence(["我來試試看，你聽聽看對不對！"], ANIMAL_VOICE);
        return tryingSeq.done;
      })
      .then(() => {
        if (cancelledRef.current) return undefined;
        setFoundIndex(null);
        const before = chars.slice(0, missingIndex);
        const beforeSeq = speakSequence(before, {
          ...ANIMAL_VOICE,
          rate: ANIMAL_HIGHLIGHT_READING_RATE,
          onCharStart: setActiveIndex,
        });
        return beforeSeq.done;
      })
      .then(() => {
        if (cancelledRef.current) return undefined;
        setActiveIndex(missingIndex);
        return playAudioUrl(url);
      })
      .then(() => {
        if (cancelledRef.current) return undefined;
        setActiveIndex(null);
        const after = chars.slice(missingIndex + 1);
        const afterSeq = speakSequence(after, {
          ...ANIMAL_VOICE,
          rate: ANIMAL_HIGHLIGHT_READING_RATE,
          onCharStart: (i) => setActiveIndex(missingIndex + 1 + i),
        });
        return afterSeq.done;
      })
      .then(() => {
        if (cancelledRef.current) return;
        setActiveIndex(null);
        playStarSound();
        const praiseSeq = speakSequence(["太棒了，我學會了！"], ANIMAL_VOICE);
        praiseSeq.done.then(() => {
          if (!cancelledRef.current) setTimeout(onComplete, 300);
        });
      });
  }

  if (missingChar === null || missingIndex === null) return null;

  return (
    <div>
      <p style={{ textAlign: "center", fontSize: "2.5rem", margin: "0 0 4px" }} aria-hidden>
        {animal}
      </p>
      {/* Every variant below shares the exact same font size and minHeight
          (generous enough for two lines) so switching between them while
          she's physically holding the character down can never reflow the
          page — a text swap that grows this block would push the
          SentenceCard down and slide the character out from under her
          finger, firing a native pointerleave and ending the press exactly
          when she's mid-recording. */}
      {recorderState === "recording" ? (
        <p style={{ ...PHASE_TEXT_STYLE, color: "var(--color-danger)", fontWeight: 800 }}>
          🔴 錄音中！念出聲音吧，念完放開
        </p>
      ) : priming ? (
        <p style={{ ...PHASE_TEXT_STYLE, color: "var(--color-primary)", fontWeight: 700 }}>
          👂 聽好喔，聽到「叮」一聲後開始念…
        </p>
      ) : (
        <p style={{ ...PHASE_TEXT_STYLE, color: "var(--color-text-muted)" }}>
          {phase === "reading" && "🔊 小動物正在練習念這句話…"}
          {phase === "recording" && `牠卡住了！按住句子裡的「${missingChar}」，教牠怎麼念`}
          {phase === "reciting" && "🔊 小動物在跟著你學…"}
        </p>
      )}
      <SentenceCard
        sentence={sentence.text}
        lineBreaks={sentence.lineBreaks}
        activeIndex={activeIndex}
        askingIndex={phase === "recording" && recorderState !== "recording" ? askingIndex : null}
        recordingIndex={recorderState === "recording" ? missingIndex : null}
        foundIndex={foundIndex}
        onCharPressStart={phase === "recording" ? handleCharPressStart : undefined}
        onCharPressEnd={phase === "recording" ? handleCharPressEnd : undefined}
      />
      {(priming || recorderState === "recording") && (
        // Her own finger covers the character on the card the instant she
        // presses it, so there's nothing left to actually read from unless
        // it's also shown somewhere her hand isn't — a big floating badge
        // near the top of the screen.
        <div
          aria-hidden
          style={{
            position: "fixed",
            top: "10%",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            background: recorderState === "recording" ? "var(--color-danger)" : "var(--color-primary)",
            color: "#fff",
            borderRadius: 24,
            padding: "18px 40px",
            fontSize: "4.5rem",
            fontWeight: 800,
            lineHeight: 1,
            boxShadow: "0 12px 32px rgba(0,0,0,0.35)",
            pointerEvents: "none",
          }}
        >
          {missingChar}
        </div>
      )}
      {recorderState === "denied" && (
        <p style={{ textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.85rem", marginTop: 8 }}>
          無法使用麥克風，請檢查瀏覽器的錄音權限設定
        </p>
      )}
      <div style={{ textAlign: "center", marginTop: 12 }}>
        <button
          onClick={onSkip}
          style={{
            background: "none",
            border: "none",
            color: "var(--color-text-muted)",
            fontSize: "0.85rem",
            textDecoration: "underline",
            cursor: "pointer",
          }}
        >
          先跳過
        </button>
      </div>
    </div>
  );
}
