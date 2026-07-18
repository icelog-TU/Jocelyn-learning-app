import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import type { SentenceDoc } from "../types";
import { DIFFICULTY_LABELS, starsForDifficulty } from "../lib/sentencePractice";
import { editSentenceText, saveSentenceReviewResult } from "../lib/store";
import { playCelebrationSound, playStarSound } from "../lib/sound";
import { speak } from "../lib/speech";
import { SentenceCard } from "./SentenceCard";
import { StarBurst } from "./StarBurst";
import { StarTray } from "./StarTray";
import { RecordButton } from "./RecordButton";
import { FindCharacterGame } from "./games/FindCharacterGame";
import { TeachAnimalGame } from "./games/TeachAnimalGame";
import { FillBlankGame } from "./games/FillBlankGame";

/** Budget for the completion-screen star count-up animation, in ms. */
const CELEBRATION_COUNT_BUDGET_MS = 1400;

const PRAISE_PHRASES = [
  "哇～你好棒！",
  "太厲害了！",
  "念得好清楚喔！",
  "你是小天才！",
  "超級棒的！",
  "念得好流利！",
];

/** Each round randomly picks one of these ways to interact with the
 * sentence, instead of always doing the same "record yourself reading it"
 * drill — variety keeps it feeling like play rather than a repeated test. */
type RoundMode = "classic" | "find-char" | "teach-animal" | "fill-blank";
const ROUND_MODES: RoundMode[] = ["classic", "find-char", "teach-animal", "fill-blank"];

function pickRoundMode(): RoundMode {
  return ROUND_MODES[Math.floor(Math.random() * ROUND_MODES.length)];
}

/** Minimum time to keep "我念對了" disabled after a sentence appears, so
 * tapping it the instant it renders (without reading anything) can't earn a
 * star. Scales with sentence length; capped so long sentences don't force
 * an annoyingly long wait. */
function minReadWaitMs(text: string): number {
  const len = Array.from(text).length;
  return Math.min(6000, Math.max(1200, len * 400));
}

function speakPraise() {
  const phrase = PRAISE_PHRASES[Math.floor(Math.random() * PRAISE_PHRASES.length)];
  speak(phrase, { rate: 1, pitch: 1.3 });
}

interface Props {
  session: SentenceDoc[];
  familyCode: string;
  completionActions: ReactNode;
  /** Rendered below the practice card only while a session is still active
   * (hidden once the completion screen shows, to avoid duplicating actions). */
  activeFooter?: ReactNode;
  /** Currently-flagged "needs practice" characters, for showing which chips
   * in the current sentence are already marked. Omit to hide the feature. */
  weakChars?: Set<string>;
  /** Toggles a character in/out of the weak-chars list. */
  onToggleWeakChar?: (char: string) => void;
}

/** Practices a fixed list of sentences end-to-end, awarding stars per correct
 * answer. Replaying the same sentences later (e.g. from history) still earns
 * stars each time, since correctCount accumulates on every correct review. */
export function SentencePracticeSession({
  session,
  familyCode,
  completionActions,
  activeFooter,
  weakChars,
  onToggleWeakChar,
}: Props) {
  const [localSession, setLocalSession] = useState(session);
  const [index, setIndex] = useState(0);
  const [starsEarned, setStarsEarned] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [burstKey, setBurstKey] = useState(0);
  const [pillPulseKey, setPillPulseKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [minWaitDone, setMinWaitDone] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [micRequired, setMicRequired] = useState(true);
  const [mode, setMode] = useState<RoundMode>("classic");

  const isComplete = index >= localSession.length;
  const current = localSession[index];

  const [displayedStars, setDisplayedStars] = useState(0);
  const [celebrateKey, setCelebrateKey] = useState(0);
  const celebratedRef = useRef(false);
  const starCountTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isComplete) return;
    setMinWaitDone(false);
    setHasRecorded(false);
    setMode(pickRoundMode());
    const timer = window.setTimeout(() => setMinWaitDone(true), minReadWaitMs(current.text));
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  useEffect(() => {
    if (!isComplete || celebratedRef.current) return;
    celebratedRef.current = true;
    playCelebrationSound();
    speak(`太棒了！這次唸了${localSession.length}句，得到${starsEarned}顆星星！`, {
      rate: 1,
      pitch: 1.25,
    });
    setCelebrateKey((k) => k + 1);

    const total = starsEarned;
    setDisplayedStars(0);
    if (total <= 0) return;
    const stepMs = Math.max(60, Math.min(220, CELEBRATION_COUNT_BUDGET_MS / total));
    let count = 0;
    starCountTimerRef.current = window.setInterval(() => {
      count += 1;
      setDisplayedStars(count);
      if (count >= total && starCountTimerRef.current) {
        window.clearInterval(starCountTimerRef.current);
        starCountTimerRef.current = null;
      }
    }, stepMs);
    return () => {
      if (starCountTimerRef.current) window.clearInterval(starCountTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete]);

  if (isComplete) {
    return (
      <div className="card celebration-card" style={{ textAlign: "center", position: "relative" }}>
        <div className="celebration-emoji">🎉</div>
        <StarBurst burstKey={celebrateKey} />
        <StarTray total={localSession.length} filled={correctCount} />
        <p style={{ fontSize: "1.1rem", margin: "12px 0 4px" }}>
          這次念了 {localSession.length} 句！
        </p>
        <div key={celebrateKey} className="celebration-star-count">
          <span className="celebration-star-emoji">⭐️</span>
          <span key={displayedStars} className="celebration-star-number">
            {displayedStars}
          </span>
        </div>
        <p style={{ color: "var(--color-text-muted)", margin: "0 0 4px" }}>顆星星</p>
        {completionActions}
      </div>
    );
  }

  function startEdit() {
    setEditText(current.text);
    setEditing(true);
  }

  async function saveEdit() {
    const trimmed = editText.trim();
    if (!trimmed) return;
    setSavingEdit(true);
    try {
      await editSentenceText(familyCode, current.id, trimmed);
      setLocalSession((prev) => prev.map((s) => (s.id === current.id ? { ...s, text: trimmed } : s)));
      setEditing(false);
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleCorrect(opts: { silent?: boolean } = {}) {
    if (busy) return;
    setBusy(true);
    const stars = starsForDifficulty(current.difficulty);
    setStarsEarned((s) => s + stars);
    setCorrectCount((c) => c + 1);
    setBurstKey((k) => k + 1);
    setPillPulseKey((k) => k + 1);
    if (!opts.silent) {
      playStarSound();
      speakPraise();
    }
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
          {index + 1} / {localSession.length}
        </span>
        <span className="pill">{DIFFICULTY_LABELS[current.difficulty ?? "medium"]}</span>
        <span key={pillPulseKey} className="pill pill-pop">
          ⭐️ {starsEarned}
        </span>
      </div>

      <StarTray total={localSession.length} filled={correctCount} />

      {editing ? (
        <div className="card">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={2}
            autoFocus
            style={{
              width: "100%",
              fontSize: "1.2rem",
              padding: 10,
              borderRadius: 12,
              border: "2px solid #eee0d0",
              fontFamily: "inherit",
              resize: "none",
            }}
          />
          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setEditing(false)}>
              取消
            </button>
            <button
              className="btn btn-primary"
              style={{ flex: 1 }}
              disabled={savingEdit}
              onClick={saveEdit}
            >
              {savingEdit ? "儲存中…" : "儲存"}
            </button>
          </div>
        </div>
      ) : mode === "find-char" ? (
        <FindCharacterGame
          key={current.id}
          sentence={current}
          onComplete={() => handleCorrect({ silent: true })}
          onSkip={handleSkip}
        />
      ) : mode === "teach-animal" ? (
        <TeachAnimalGame
          key={current.id}
          sentence={current}
          onComplete={() => handleCorrect({ silent: true })}
          onSkip={handleSkip}
        />
      ) : mode === "fill-blank" ? (
        <FillBlankGame
          key={current.id}
          sentence={current}
          pool={localSession}
          onComplete={() => handleCorrect({ silent: true })}
          onSkip={handleSkip}
        />
      ) : (
        <>
          <div style={{ position: "relative" }}>
            <SentenceCard
              sentence={current.text}
              lineBreaks={current.lineBreaks}
              extraActions={
                <RecordButton
                  key={current.id}
                  onRecorded={() => setHasRecorded(true)}
                  onUnavailable={() => setMicRequired(false)}
                />
              }
            />
            <StarBurst burstKey={burstKey} />
          </div>
          <div style={{ textAlign: "center", margin: "8px 0 0" }}>
            <button
              onClick={startEdit}
              style={{
                background: "none",
                border: "none",
                color: "var(--color-secondary)",
                fontSize: "0.85rem",
                textDecoration: "underline",
                cursor: "pointer",
                padding: 4,
              }}
            >
              ✏️ 這句可以改得更好？點這裡修改
            </button>
          </div>
        </>
      )}

      {!editing && mode === "classic" && onToggleWeakChar && (
        <div style={{ margin: "12px 0" }}>
          <p
            style={{
              textAlign: "center",
              fontSize: "0.8rem",
              color: "var(--color-text-muted)",
              margin: "0 0 8px",
            }}
          >
            有哪個字還不熟？點一下標記，之後 AI 造句會盡量再帶到它
          </p>
          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 8 }}>
            {Array.from(new Set(Array.from(current.text))).map((ch) => {
              const isWeak = weakChars?.has(ch) ?? false;
              return (
                <button
                  key={ch}
                  onClick={() => onToggleWeakChar(ch)}
                  style={{
                    fontSize: "1.1rem",
                    padding: "4px 12px",
                    borderRadius: 10,
                    border: isWeak ? "2px solid var(--color-primary)" : "1px solid #eee0d0",
                    background: isWeak ? "var(--color-primary)" : "#fff",
                    color: isWeak ? "#fff" : "inherit",
                    cursor: "pointer",
                  }}
                >
                  {ch}
                  {isWeak ? " ✓" : ""}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!editing && mode === "classic" && (
        <>
          <p style={{ textAlign: "center", color: "var(--color-text-muted)", margin: "16px 0" }}>
            請她把整句話念出來，念對了嗎？
          </p>

          {(!minWaitDone || (micRequired && !hasRecorded)) && (
            <p style={{ textAlign: "center", color: "var(--color-secondary)", fontSize: "0.85rem", margin: "0 0 12px" }}>
              {!minWaitDone ? "再唸一下下…" : "請先按上面「🎤 錄音念念看」念一次，才能按我念對了喔"}
            </p>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-outline btn-block" disabled={busy} onClick={handleSkip}>
              先跳過
            </button>
            <button
              className="btn btn-primary btn-block"
              disabled={busy || !minWaitDone || (micRequired && !hasRecorded)}
              onClick={() => handleCorrect()}
            >
              🎉 我念對了！
            </button>
          </div>
        </>
      )}

      {activeFooter}
    </div>
  );
}
