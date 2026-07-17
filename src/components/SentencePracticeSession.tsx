import type { ReactNode } from "react";
import { useState } from "react";
import type { SentenceDoc } from "../types";
import { DIFFICULTY_LABELS, starsForDifficulty } from "../lib/sentencePractice";
import { saveSentenceReviewResult } from "../lib/store";
import { playStarSound } from "../lib/sound";
import { SentenceCard } from "./SentenceCard";
import { StarBurst } from "./StarBurst";
import { RecordButton } from "./RecordButton";

const PRAISE_PHRASES = [
  "哇～你好棒！",
  "太厲害了！",
  "念得好清楚喔！",
  "你是小天才！",
  "超級棒的！",
  "念得好流利！",
];

function speakPraise() {
  if (!("speechSynthesis" in window)) return;
  const phrase = PRAISE_PHRASES[Math.floor(Math.random() * PRAISE_PHRASES.length)];
  const utterance = new SpeechSynthesisUtterance(phrase);
  utterance.lang = "zh-TW";
  utterance.rate = 1;
  utterance.pitch = 1.3;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

interface Props {
  session: SentenceDoc[];
  familyCode: string;
  completionActions: ReactNode;
  /** Rendered below the practice card only while a session is still active
   * (hidden once the completion screen shows, to avoid duplicating actions). */
  activeFooter?: ReactNode;
}

/** Practices a fixed list of sentences end-to-end, awarding stars per correct
 * answer. Replaying the same sentences later (e.g. from history) still earns
 * stars each time, since correctCount accumulates on every correct review. */
export function SentencePracticeSession({
  session,
  familyCode,
  completionActions,
  activeFooter,
}: Props) {
  const [index, setIndex] = useState(0);
  const [starsEarned, setStarsEarned] = useState(0);
  const [burstKey, setBurstKey] = useState(0);
  const [busy, setBusy] = useState(false);

  const isComplete = index >= session.length;

  if (isComplete) {
    return (
      <div className="card" style={{ textAlign: "center" }}>
        <div style={{ fontSize: "3rem" }}>🎉</div>
        <p style={{ fontSize: "1.1rem" }}>
          這次念了 {session.length} 句，得到 {starsEarned} 顆星星！
        </p>
        {completionActions}
      </div>
    );
  }

  const current = session[index];

  async function handleCorrect() {
    if (busy) return;
    setBusy(true);
    const stars = starsForDifficulty(current.difficulty);
    setStarsEarned((s) => s + stars);
    setBurstKey((k) => k + 1);
    playStarSound();
    speakPraise();
    try {
      await saveSentenceReviewResult(familyCode, current.id, true);
    } finally {
      setTimeout(() => {
        setIndex((i) => i + 1);
        setBusy(false);
      }, 900);
    }
  }

  function handleSkip() {
    if (busy) return;
    setIndex((i) => i + 1);
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <span className="pill">
          {index + 1} / {session.length}
        </span>
        <span className="pill">{DIFFICULTY_LABELS[current.difficulty ?? "medium"]}</span>
        <span className="pill">⭐️ {starsEarned}</span>
      </div>

      <div style={{ position: "relative" }}>
        <SentenceCard sentence={current.text} />
        <StarBurst burstKey={burstKey} />
      </div>

      <div style={{ textAlign: "center", margin: "16px 0" }}>
        <RecordButton key={current.id} />
      </div>

      <p style={{ textAlign: "center", color: "var(--color-text-muted)", margin: "16px 0" }}>
        請她把整句話念出來，念對了嗎？
      </p>

      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn btn-outline btn-block" disabled={busy} onClick={handleSkip}>
          先跳過
        </button>
        <button className="btn btn-primary btn-block" disabled={busy} onClick={handleCorrect}>
          🎉 我念對了！
        </button>
      </div>

      {activeFooter}
    </div>
  );
}
