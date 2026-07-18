import { useEffect, useMemo, useRef, useState } from "react";
import type { SentenceDoc } from "../../types";
import { SentenceCard } from "../SentenceCard";
import { speak } from "../../lib/speech";
import { speakSequence } from "../../lib/ttsSequence";
import { playInsufficientSound, playStarSound } from "../../lib/sound";
import { shuffled } from "../../lib/sentenceGames";

interface Props {
  sentence: SentenceDoc;
  onComplete: () => void;
  onSkip: () => void;
}

/** Below this drag distance (px), a pointer-down/up is treated as "just tap
 * it to hear the sound", not an attempt to place/move it. */
const TAP_THRESHOLD = 18;

interface Chip {
  id: number;
  char: string;
}

/** A chip's current home: the shuffled pool below, or a specific slot index
 * in the answer row. */
type Location = "pool" | number;

/** "詞語排列" — the sentence is shown as a normal reference card (so this is
 * a placement puzzle, not a memory test), and its characters are also
 * scattered as draggable chips below; she drags each one into the matching
 * slot to rebuild the sentence. Tapping any chip — whether still loose in
 * the pool or already placed — just speaks it; only a real drag moves it,
 * the same tap-vs-drag split used by the other drag-based games. */
export function WordOrderGame({ sentence, onComplete, onSkip }: Props) {
  const targetChips = useMemo(
    () =>
      Array.from(sentence.text)
        .map((char, id) => ({ id, char }))
        .filter((c) => /\p{Script=Han}/u.test(c.char)),
    [sentence.id],
  );

  const [slots, setSlots] = useState<(Chip | null)[]>(() => Array(targetChips.length).fill(null));
  const [pool, setPool] = useState<Chip[]>(() => shuffled(targetChips));
  const [resolved, setResolved] = useState(false);
  const [drag, setDrag] = useState<{ chip: Chip; from: Location; x: number; y: number } | null>(null);

  const dragStartRef = useRef<{ x: number; y: number; chip: Chip; from: Location } | null>(null);
  const slotElsRef = useRef<Array<HTMLElement | null>>([]);
  const checkedKeyRef = useRef<string | null>(null);

  const playable = targetChips.length >= 2;

  useEffect(() => {
    if (!playable) {
      onSkip();
      return;
    }
    speakSequence(["哇，句子被打散了！把字拖回正確的位置，排出一模一樣的句子吧！"]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentence.id, playable]);

  // Checks completion whenever every slot is filled.
  useEffect(() => {
    if (!playable || resolved) return;
    if (slots.some((s) => s === null)) return;
    const key = slots.map((s) => s!.id).join(",");
    if (checkedKeyRef.current === key) return;
    checkedKeyRef.current = key;

    const correct = slots.every((s, i) => s!.char === targetChips[i].char);
    if (correct) {
      setResolved(true);
      playStarSound();
      const seq = speakSequence(["哇，排對了！你把句子排好了！"]);
      seq.done.then(() => setTimeout(onComplete, 400));
    } else {
      playInsufficientSound();
      speakSequence(["順序還不太對，比對看看，再排排看喔"]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots, playable, resolved]);

  if (!playable) return null;

  function moveChip(chip: Chip, from: Location, to: Location) {
    if (from === to) return;
    setSlots((prevSlots) => {
      const nextSlots = [...prevSlots];
      let poolAdd: Chip[] = [];
      let poolRemoveId: number | null = null;

      if (to === "pool") {
        if (typeof from === "number") nextSlots[from] = null;
        poolAdd = [chip];
      } else {
        const bumped = nextSlots[to];
        nextSlots[to] = chip;
        if (typeof from === "number") {
          nextSlots[from] = bumped ?? null;
        } else {
          poolRemoveId = chip.id;
          if (bumped) poolAdd = [bumped];
        }
      }

      setPool((prevPool) => {
        let nextPool = prevPool;
        if (poolRemoveId !== null) nextPool = nextPool.filter((c) => c.id !== poolRemoveId);
        if (poolAdd.length > 0) nextPool = [...nextPool, ...poolAdd];
        return nextPool;
      });

      return nextSlots;
    });
  }

  function handlePointerDown(e: React.PointerEvent, chip: Chip, from: Location) {
    if (resolved) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStartRef.current = { x: e.clientX, y: e.clientY, chip, from };
    setDrag({ chip, from, x: e.clientX, y: e.clientY });
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
      speak(start.chip.char);
      return;
    }

    let targetSlotIndex: number | null = null;
    slotElsRef.current.forEach((el, i) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
        targetSlotIndex = i;
      }
    });

    moveChip(start.chip, start.from, targetSlotIndex === null ? "pool" : targetSlotIndex);
  }

  const chipBaseStyle = {
    width: 52,
    height: 52,
    display: "flex" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    fontSize: "1.7rem",
    fontWeight: 700,
    borderRadius: 12,
    cursor: resolved ? "default" : "grab",
    touchAction: "none" as const,
    userSelect: "none" as const,
  };

  return (
    <div>
      <p style={{ textAlign: "center", color: "var(--color-text-muted)", margin: "0 0 12px", minHeight: "1.4em" }}>
        {resolved ? "🎉 排對了！" : "🧩 對照上面的句子，把下面的字拖到正確的位置"}
      </p>
      <SentenceCard sentence={sentence.text} lineBreaks={sentence.lineBreaks} />

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 8,
          margin: "16px 0",
          touchAction: "none",
        }}
      >
        {slots.map((chip, i) => (
          <div
            key={i}
            ref={(el) => {
              slotElsRef.current[i] = el;
            }}
            onPointerDown={chip ? (e) => handlePointerDown(e, chip, i) : undefined}
            onPointerMove={chip ? handlePointerMove : undefined}
            onPointerUp={chip ? handlePointerUp : undefined}
            onPointerCancel={chip ? handlePointerUp : undefined}
            aria-label={chip ? `這裡放了「${chip.char}」，點一下聽聲音，拖走可以移開` : `第 ${i + 1} 個空格`}
            style={{
              ...chipBaseStyle,
              background: chip ? "#fff1e2" : "none",
              border: chip ? "2px solid var(--color-primary)" : "3px dashed var(--color-secondary)",
              opacity: drag?.from === i ? 0.3 : 1,
            }}
          >
            {chip?.char}
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 8,
          margin: "0 0 16px",
          minHeight: 60,
          touchAction: "none",
        }}
      >
        {pool.map((chip) => (
          <div
            key={chip.id}
            onPointerDown={(e) => handlePointerDown(e, chip, "pool")}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            aria-label={`字「${chip.char}」，點一下聽聲音，拖到上面的空格裡`}
            style={{
              ...chipBaseStyle,
              background: "#fff1e2",
              border: "2px solid #eee0d0",
              opacity: drag?.chip.id === chip.id && drag.from === "pool" ? 0.3 : 1,
            }}
          >
            {chip.char}
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
            fontSize: "1.7rem",
            fontWeight: 700,
            background: "#fff",
            border: "2px solid var(--color-primary)",
            borderRadius: 12,
            padding: "6px 14px",
            boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
            pointerEvents: "none",
            zIndex: 1000,
          }}
        >
          {drag.chip.char}
        </div>
      )}

      <div style={{ textAlign: "center" }}>
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
