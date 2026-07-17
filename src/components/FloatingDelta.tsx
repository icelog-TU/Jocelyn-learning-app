import "./FloatingDelta.css";

interface Props {
  text: string;
  triggerKey: number;
  color: string;
}

/** Text that pops up and rises away, for a single moment of "something just
 * changed here" feedback (e.g. "-5⭐️" or "+2❤️"). Re-triggers whenever
 * triggerKey changes; renders nothing at triggerKey 0 (the "never fired"
 * sentinel). */
export function FloatingDelta({ text, triggerKey, color }: Props) {
  if (triggerKey === 0) return null;
  return (
    <span key={triggerKey} className="floating-delta" style={{ color }}>
      {text}
    </span>
  );
}
