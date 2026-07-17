import "./HeartMeter.css";

interface Props {
  hearts: number;
  /** Number of slots to draw; hearts beyond this still count but the meter
   * itself stays full rather than growing forever. */
  cap?: number;
}

/** A row of heart slots that fill in one at a time, so a child who can't
 * read a number yet can SEE affection progress build up (matching the
 * StarTray pattern used during sentence practice). */
export function HeartMeter({ hearts, cap = 10 }: Props) {
  const filled = Math.min(hearts, cap);
  return (
    <div className="heart-meter">
      {Array.from({ length: cap }, (_, i) => (
        <span key={i} className={i < filled ? "heart-meter-slot filled" : "heart-meter-slot"}>
          ❤️
        </span>
      ))}
    </div>
  );
}
