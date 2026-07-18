import { useEffect, useMemo, useState } from "react";
import type { SentenceDoc } from "../../types";
import { SentenceCard } from "../SentenceCard";
import { speakSequence, DEFAULT_RATE, HIGHLIGHT_READING_RATE_MULTIPLIER } from "../../lib/ttsSequence";
import { playInsufficientSound, playStarSound } from "../../lib/sound";
import { pickTargetIndex } from "../../lib/sentenceGames";

interface Props {
  sentence: SentenceDoc;
  onComplete: () => void;
  onSkip: () => void;
}

/** "找一找" — the whole sentence is read aloud with each character
 * highlighting karaoke-style as it's spoken, then the child is asked to find
 * one specific character by tapping it directly on the sentence card. No
 * recording, no self-reported "did I get it right" — the tap itself proves
 * she found the right shape, which is the whole point (connecting a
 * character's shape to its sound) without it feeling like being tested. */
export function FindCharacterGame({ sentence, onComplete, onSkip }: Props) {
  const chars = useMemo(() => Array.from(sentence.text), [sentence.text]);
  const targetIndex = useMemo(
    () => pickTargetIndex(sentence.text, sentence.sourceChars),
    [sentence.text, sentence.sourceChars],
  );
  const targetChar = targetIndex !== null ? chars[targetIndex] : null;

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [shakeIndex, setShakeIndex] = useState<number | null>(null);
  const [phase, setPhase] = useState<"reading" | "searching" | "found">("reading");

  useEffect(() => {
    if (targetChar === null) {
      onSkip();
      return;
    }

    setPhase("reading");
    setActiveIndex(null);
    setShakeIndex(null);

    let cancelled = false;
    const readSeq = speakSequence(chars, {
      rate: DEFAULT_RATE * HIGHLIGHT_READING_RATE_MULTIPLIER,
      onCharStart: setActiveIndex,
    });
    readSeq.done.then(() => {
      if (cancelled) return;
      setActiveIndex(null);
      const askSeq = speakSequence([`小朋友，你能找到「${targetChar}」在哪裡嗎？`]);
      askSeq.done.then(() => {
        if (!cancelled) setPhase("searching");
      });
    });
    return () => {
      cancelled = true;
      readSeq.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentence.id]);

  function handleCharTap(index: number) {
    if (phase !== "searching") return;
    if (index === targetIndex) {
      setPhase("found");
      playStarSound();
      const seq = speakSequence([`好棒哦，你找到「${targetChar}」這個字了！`]);
      seq.done.then(() => setTimeout(onComplete, 300));
    } else {
      setShakeIndex(index);
      playInsufficientSound();
      speakSequence(["再找找看喔"]);
      setTimeout(() => setShakeIndex((cur) => (cur === index ? null : cur)), 500);
    }
  }

  if (targetChar === null) return null;

  return (
    <div>
      <p style={{ textAlign: "center", color: "var(--color-text-muted)", margin: "0 0 12px", minHeight: "1.4em" }}>
        {phase === "reading" && "🔊 仔細聽，整句話要念出來囉…"}
        {phase === "searching" && `👀 找找看「${targetChar}」在哪裡？`}
        {phase === "found" && "🎉 找到了！"}
      </p>
      <SentenceCard
        sentence={sentence.text}
        lineBreaks={sentence.lineBreaks}
        activeIndex={activeIndex}
        shakeIndex={shakeIndex}
        foundIndex={phase === "found" ? targetIndex : null}
        onCharTap={phase === "searching" ? handleCharTap : undefined}
      />
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
