import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import type { SentenceDoc } from "../types";
import { DIFFICULTY_LABELS, starsForDifficulty } from "../lib/sentencePractice";
import { editSentenceText, restoreSentenceStats, saveSentenceReviewResult } from "../lib/store";
import { playCelebrationSound, playStarSound } from "../lib/sound";
import { speak } from "../lib/speech";
import { StarBurst } from "./StarBurst";
import { StarTray } from "./StarTray";
import { FindCharacterGame } from "./games/FindCharacterGame";
import { TeachAnimalGame } from "./games/TeachAnimalGame";
import { FillBlankGame } from "./games/FillBlankGame";
import { WordOrderGame } from "./games/WordOrderGame";
import { WhoReadItRightGame } from "./games/WhoReadItRightGame";
import { shuffled } from "../lib/sentenceGames";

/** Budget for the completion-screen star count-up animation, in ms. */
const CELEBRATION_COUNT_BUDGET_MS = 1400;

/** Each round picks one of these ways to interact with the sentence, drawn
 * from a "shuffle bag" (see modeQueueRef below) so a mode can't stay picked
 * for very long before every other mode has had a turn — no consecutive
 * streaks, and no mode going missing for an unlucky number of rounds in a
 * row.
 *
 * "word-order" appears twice in the bag, giving it roughly double the pick
 * chance of the rest: rebuilding the whole sentence from scratch is the
 * mode most likely to actually force reading every character in order.
 * fill-blank in particular can be solved by reading only up to the blank
 * and shape-matching the pool chip against the character remembered from
 * the card, without ever decoding the characters after it. */
type RoundMode = "find-char" | "teach-animal" | "fill-blank" | "word-order" | "who-read-right";
const ROUND_MODES: RoundMode[] = [
  "find-char",
  "teach-animal",
  "fill-blank",
  "word-order",
  "word-order",
  "who-read-right",
];

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
  /** Fires exactly once, the moment the session first reaches its
   * completion screen — used to release a staged 老師準備區 character into
   * the normal learned pool right when the child finishes practicing it. */
  onSessionComplete?: () => void;
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
  onSessionComplete,
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
  const [mode, setMode] = useState<RoundMode>("find-char");

  const isComplete = index >= localSession.length;
  const current = localSession[index];

  const [displayedStars, setDisplayedStars] = useState(0);
  const [celebrateKey, setCelebrateKey] = useState(0);
  const celebratedRef = useRef(false);
  const starCountTimerRef = useRef<number | null>(null);
  /** One entry per round already answered/skipped, in order — lets "回上一句"
   * undo exactly what that round did (the stars/progress it added, and the
   * sentence's persisted stats) instead of just rewinding the index and
   * leaving stale progress behind. */
  const roundHistoryRef = useRef<Array<{ wasCorrect: boolean; stars: number }>>([]);
  /** A "shuffle bag" of modes: refilled with a freshly-shuffled copy of
   * ROUND_MODES (word-order counted twice) whenever it runs dry, so a mode
   * still can't repeat back-to-back or vanish for long stretches — plain
   * independent random picks could otherwise streak the same mode for
   * several sentences in a row, which is exactly what felt repetitive/
   * boring in practice — while word-order's extra entry keeps its overall
   * share roughly doubled. */
  const modeQueueRef = useRef<RoundMode[]>([]);

  function nextRoundMode(): RoundMode {
    if (modeQueueRef.current.length === 0) {
      modeQueueRef.current = shuffled(ROUND_MODES);
    }
    return modeQueueRef.current.shift()!;
  }

  // Silences any speech still queued/playing (e.g. a game's closing praise
  // line that hadn't finished yet) so it can't bleed into a new round's
  // screen and sound like it belongs to whatever is now on screen. Wrapped
  // because a throw here (seen on some real devices) would otherwise abort
  // the effect before `setMode` below ever ran, permanently stranding the
  // round on whatever it was already showing.
  function safeCancelSpeech() {
    try {
      window.speechSynthesis?.cancel();
    } catch {
      // Nothing more productive to do — see above.
    }
  }

  useEffect(() => {
    if (isComplete) return;
    safeCancelSpeech();
    setMode(nextRoundMode());
    return safeCancelSpeech;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  useEffect(() => {
    if (!isComplete || celebratedRef.current) return;
    celebratedRef.current = true;
    onSessionComplete?.();
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

  async function handleCorrect() {
    if (busy) return;
    setBusy(true);
    const stars = starsForDifficulty(current.difficulty);
    setStarsEarned((s) => s + stars);
    setCorrectCount((c) => c + 1);
    setBurstKey((k) => k + 1);
    setPillPulseKey((k) => k + 1);
    // Fires exactly when the star tray/top counter actually updates (not
    // inside the mini-game itself), so the sound is unmistakably tied to
    // the moment a star visibly turns from ☆ to ⭐️, whichever game earned it.
    playStarSound();
    roundHistoryRef.current.push({ wasCorrect: true, stars });
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
    roundHistoryRef.current.push({ wasCorrect: false, stars: 0 });
    setIndex((i) => i + 1);
  }

  /** Undoes the previous round entirely — not just moving the index back,
   * but also reverting the stars/progress it added and, if it was marked
   * correct, restoring that sentence's persisted stats to what they were
   * before. Exists mainly for the "教小動物" recording: releasing the press
   * a moment too early still finishes the round with a blank clip, and by
   * the time that's noticed the session has already moved on. */
  async function handleGoBack() {
    if (busy || index === 0) return;
    const entry = roundHistoryRef.current.pop();
    if (!entry) return;
    setBusy(true);
    try {
      if (entry.wasCorrect) {
        setStarsEarned((s) => s - entry.stars);
        setCorrectCount((c) => c - 1);
        const previous = localSession[index - 1];
        await restoreSentenceStats(familyCode, previous.id, previous.stats);
      }
      setIndex((i) => Math.max(0, i - 1));
    } finally {
      setBusy(false);
    }
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
        <span style={{ position: "relative" }}>
          <span key={pillPulseKey} className="pill pill-pop">
            ⭐️ {starsEarned}
          </span>
          <StarBurst burstKey={burstKey} />
        </span>
      </div>

      {index > 0 && (
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <button
            onClick={handleGoBack}
            disabled={busy}
            style={{
              background: "none",
              border: "none",
              color: "var(--color-text-muted)",
              fontSize: "0.85rem",
              textDecoration: "underline",
              cursor: "pointer",
              padding: 4,
            }}
          >
            ⬅️ 回上一句（重來一次）
          </button>
        </div>
      )}

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
        <FindCharacterGame key={current.id} sentence={current} onComplete={handleCorrect} onSkip={handleSkip} />
      ) : mode === "teach-animal" ? (
        <TeachAnimalGame key={current.id} sentence={current} onComplete={handleCorrect} onSkip={handleSkip} />
      ) : mode === "fill-blank" ? (
        <FillBlankGame
          key={current.id}
          sentence={current}
          pool={localSession}
          onComplete={handleCorrect}
          onSkip={handleSkip}
        />
      ) : mode === "word-order" ? (
        <WordOrderGame key={current.id} sentence={current} onComplete={handleCorrect} onSkip={handleSkip} />
      ) : (
        <WhoReadItRightGame key={current.id} sentence={current} onComplete={handleCorrect} onSkip={handleSkip} />
      )}

      {!editing && (
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
      )}

      {!editing && onToggleWeakChar && (
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

      {activeFooter}
    </div>
  );
}
