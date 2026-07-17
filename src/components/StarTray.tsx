import "./StarTray.css";

interface Props {
  total: number;
  filled: number;
}

/** A row of star slots that pop in one at a time as sentences are answered
 * correctly, so a child who isn't yet number-savvy can SEE progress build up
 * rather than reading a count. */
export function StarTray({ total, filled }: Props) {
  return (
    <div className="star-tray">
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={i < filled ? "star-tray-slot filled" : "star-tray-slot"}>
          {i < filled ? "⭐️" : "☆"}
        </span>
      ))}
    </div>
  );
}
