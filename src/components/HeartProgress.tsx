import "./HeartProgress.css";
import { speak } from "../lib/speech";

interface Props {
  /** Hearts earned so far (already clamped/animated by the caller). */
  filled: number;
}

const MAX_HEARTS = 10;
const HEARTS_PER_ROW = 5;

/** A persistent row of 10 heart outlines under the creature, filled in as
 * hearts are earned — so progress toward the next stage is visible at a
 * glance even when nothing is animating, not just during the brief burst
 * effect right after a gift. */
export function HeartProgress({ filled }: Props) {
  const clamped = Math.max(0, Math.min(Math.round(filled), MAX_HEARTS));
  const rows: number[][] = [];
  for (let i = 0; i < MAX_HEARTS; i += HEARTS_PER_ROW) {
    rows.push(Array.from({ length: Math.min(HEARTS_PER_ROW, MAX_HEARTS - i) }, (_, j) => i + j));
  }

  return (
    <button
      type="button"
      className="heart-progress"
      aria-label={`好感度 ${clamped} / ${MAX_HEARTS} 顆心`}
      onClick={() => speak(`已經有 ${clamped} 顆愛心`)}
    >
      {rows.map((row, ri) => (
        <div className="heart-progress-row" key={ri}>
          {row.map((i) => (
            <span key={i} className={`heart-progress-dot${i < clamped ? " filled" : ""}`}>
              {i < clamped ? "❤️" : "🤍"}
            </span>
          ))}
        </div>
      ))}
    </button>
  );
}
