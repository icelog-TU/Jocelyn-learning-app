import { useEffect, useMemo, useRef, useState } from "react";
import type { SentenceDoc } from "../../types";
import { SentenceCard } from "../SentenceCard";
import { speak } from "../../lib/speech";
import { speakSequence } from "../../lib/ttsSequence";
import { playInsufficientSound, playStarSound } from "../../lib/sound";
import { pickTargetIndex } from "../../lib/sentenceGames";

interface Props {
  sentence: SentenceDoc;
  /** The full pool of sentences in this practice session — mined for
   * "wrong answer" character candidates so nothing extra needs to be
   * prepared ahead of time. */
  pool: SentenceDoc[];
  onComplete: () => void;
  onSkip: () => void;
}

/** Below this drag distance (px), a pointer-down/up on an option is treated
 * as "just tap it to hear the sound", not an attempt to place it — lets a
 * child freely listen to all four candidates before committing to one. */
const TAP_THRESHOLD = 18;

function shuffled<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickDecoys(targetChar: string, sentenceChars: Set<string>, pool: SentenceDoc[]): string[] {
  const candidates = new Set<string>();
  for (const s of pool) {
    for (const c of Array.from(s.text)) {
      if (/\p{Script=Han}/u.test(c) && c !== targetChar && !sentenceChars.has(c)) candidates.add(c);
    }
  }
  return shuffled([...candidates]).slice(0, 3);
}

interface DragState {
  key: string;
  char: string;
  x: number;
  y: number;
}

/** "字寶寶回家" — a character is pulled out of the sentence, leaving an empty
 * slot; four candidate characters (the right one + three decoys pulled from
 * this session's other sentences) sit below it. Tapping a candidate just
 * speaks it, so she can freely listen to all four — only dragging one onto
 * the empty slot counts as an actual answer, which is what tells the game
 * "she picked this one" instead of "she was just listening". */
export function FillBlankGame({ sentence, pool, onComplete, onSkip }: Props) {
  const chars = useMemo(() => Array.from(sentence.text), [sentence.text]);
  const blankIndex = useMemo(
    () => pickTargetIndex(sentence.text, sentence.sourceChars),
    [sentence.text, sentence.sourceChars],
  );
  const targetChar = blankIndex !== null ? chars[blankIndex] : null;

  const decoys = useMemo(() => {
    if (!targetChar) return [];
    return pickDecoys(targetChar, new Set(chars), pool);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentence.id]);
  const options = useMemo(() => (targetChar ? shuffled([targetChar, ...decoys]) : []), [targetChar, decoys]);

  const [resolved, setResolved] = useState(false);
  const [wrongKey, setWrongKey] = useState(0);
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; key: string; char: string } | null>(null);
  const blankSlotElRef = useRef<HTMLElement | null>(null);

  const playable = targetChar !== null && blankIndex !== null && decoys.length >= 3;

  useEffect(() => {
    if (!playable) {
      onSkip();
      return;
    }
    speakSequence(["哇，字寶寶不見了，請幫字寶寶回家！"]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentence.id, playable]);

  if (!playable || targetChar === null || blankIndex === null) {
    return null;
  }

  function handlePointerDown(e: React.PointerEvent, char: string) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStartRef.current = { x: e.clientX, y: e.clientY, key: char, char };
    setDrag({ key: char, char, x: e.clientX, y: e.clientY });
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragStartRef.current) return;
    setDrag({ ...dragStartRef.current, x: e.clientX, y: e.clientY });
  }

  function handlePointerUp(e: React.PointerEvent) {
    const start = dragStartRef.current;
    dragStartRef.current = null;
    setDrag(null);
    if (!start || resolved) return;

    const dist = Math.hypot(e.clientX - start.x, e.clientY - start.y);
    if (dist < TAP_THRESHOLD) {
      speak(start.char);
      return;
    }

    const slotEl = blankSlotElRef.current;
    if (!slotEl) return;
    const rect = slotEl.getBoundingClientRect();
    const hit = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
    if (!hit) return;

    if (start.char === targetChar) {
      setResolved(true);
      playStarSound();
      const seq = speakSequence(["哇，謝謝你把字寶寶送回家了！"]);
      seq.done.then(() => setTimeout(onComplete, 300));
    } else {
      setWrongKey((k) => k + 1);
      playInsufficientSound();
      speakSequence(["不是這個字寶寶，再找找看喔"]);
    }
  }

  return (
    <div>
      <p style={{ textAlign: "center", color: "var(--color-text-muted)", margin: "0 0 12px", minHeight: "1.4em" }}>
        {resolved ? "🎉 字寶寶回家了！" : "🧩 拖對的字寶寶到空格裡；點一下可以先聽聽看喔"}
      </p>
      <SentenceCard
        sentence={sentence.text}
        lineBreaks={sentence.lineBreaks}
        blankIndex={resolved ? null : blankIndex}
        blankSlotRef={(el) => {
          blankSlotElRef.current = el;
        }}
        foundIndex={resolved ? blankIndex : null}
      />
      <div
        key={wrongKey}
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 14,
          marginTop: 16,
          touchAction: "none",
        }}
      >
        {options.map((opt) => (
          <div
            key={opt}
            onPointerDown={(e) => handlePointerDown(e, opt)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            aria-label={`字寶寶「${opt}」，點一下聽聲音，拖到空格裡選它`}
            style={{
              width: 56,
              height: 56,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.8rem",
              fontWeight: 700,
              background: "#fff1e2",
              borderRadius: 14,
              border: "2px solid #eee0d0",
              cursor: resolved ? "default" : "grab",
              touchAction: "none",
              opacity: drag?.key === opt ? 0.3 : resolved ? 0.5 : 1,
              userSelect: "none",
            }}
          >
            {opt}
          </div>
        ))}
      </div>
      {drag && (
        <div
          aria-hidden
          style={{
            position: "fixed",
            left: drag.x,
            top: drag.y,
            transform: "translate(-50%, -50%)",
            fontSize: "1.8rem",
            fontWeight: 700,
            background: "#fff",
            border: "2px solid var(--color-primary)",
            borderRadius: 14,
            padding: "6px 14px",
            boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
            pointerEvents: "none",
            zIndex: 1000,
          }}
        >
          {drag.char}
        </div>
      )}
      <div style={{ textAlign: "center", marginTop: 16 }}>
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
