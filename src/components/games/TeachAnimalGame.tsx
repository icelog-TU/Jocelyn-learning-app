import { useEffect, useMemo, useRef, useState } from "react";
import type { SentenceDoc } from "../../types";
import { SentenceCard } from "../SentenceCard";
import { useAudioRecorder } from "../../hooks/useAudioRecorder";
import { speakSequence } from "../../lib/ttsSequence";
import { playAudioUrl } from "../../lib/audioPlayback";
import { playRecordStartSound, playStarSound } from "../../lib/sound";
import { pickAnimalEmoji, pickTargetIndex } from "../../lib/sentenceGames";

interface Props {
  sentence: SentenceDoc;
  onComplete: () => void;
  onSkip: () => void;
}

/** Distinctly higher/slower than the narrator voice used elsewhere, so it's
 * obviously "a different character talking" rather than the app's own
 * narration. */
const ANIMAL_VOICE = { pitch: 1.6, rate: 0.95 };

/** Below this hold duration (ms), a press is almost certainly an accidental
 * tap-and-release rather than a real attempt to say the character out loud
 * — discard the (likely blank) recording and ask her to try again instead
 * of letting the animal "learn" from silence. */
const MIN_HOLD_MS = 500;

type Phase = "reading" | "recording" | "reciting";

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

  const [phase, setPhase] = useState<Phase>("reading");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [askingIndex, setAskingIndex] = useState<number | null>(null);
  const [foundIndex, setFoundIndex] = useState<number | null>(null);
  const cancelledRef = useRef(false);
  const pressStartRef = useRef<number | null>(null);

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

    const before = chars.slice(0, missingIndex);
    const readSeq = speakSequence(before, { ...ANIMAL_VOICE, onCharStart: setActiveIndex });
    readSeq.done.then(() => {
      if (cancelledRef.current) return;
      setActiveIndex(null);
      setAskingIndex(missingIndex);
      // Deliberately never speaks the missing character itself — the whole
      // premise is "I don't know this one", so saying it out loud here
      // would contradict that. The on-screen text still names it visually.
      const askSeq = speakSequence(["嗯…這個字我不會念，你可以教我嗎？按住這個字，念給我聽吧！"], ANIMAL_VOICE);
      askSeq.done.then(() => {
        if (!cancelledRef.current) setPhase("recording");
      });
    });

    return () => {
      cancelledRef.current = true;
      readSeq.cancel();
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

  // Fires the instant the microphone actually starts capturing — the clear
  // "go" signal she asked for, since the press itself only requests
  // permission and there's no other reliable way to know recording has
  // really begun (especially the first time, when the browser's own
  // permission prompt adds an unpredictable delay after the press).
  useEffect(() => {
    if (recorderState === "recording") playRecordStartSound();
  }, [recorderState]);

  function handleCharPressStart(index: number) {
    if (phase !== "recording" || index !== missingIndex || recorderState !== "idle") return;
    pressStartRef.current = Date.now();
    startRecording();
  }

  function handleCharPressEnd(index: number) {
    if (phase !== "recording" || index !== missingIndex || recorderState !== "recording") return;
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
        setFoundIndex(null);
        const before = chars.slice(0, missingIndex);
        const beforeSeq = speakSequence(before, { ...ANIMAL_VOICE, onCharStart: setActiveIndex });
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
      {recorderState === "recording" ? (
        <p
          style={{
            textAlign: "center",
            color: "var(--color-danger)",
            fontWeight: 800,
            fontSize: "1.3rem",
            margin: "0 0 12px",
            minHeight: "1.4em",
          }}
        >
          🔴 錄音中！念出聲音吧，念完放開
        </p>
      ) : (
        <p style={{ textAlign: "center", color: "var(--color-text-muted)", margin: "0 0 12px", minHeight: "1.4em" }}>
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
