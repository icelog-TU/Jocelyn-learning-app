import "./StarBurst.css";

interface Props {
  burstKey: number;
}

const OFFSETS = [
  { x: -60, y: -80, rotate: -20, delay: 0 },
  { x: 0, y: -100, rotate: 10, delay: 0.05 },
  { x: 60, y: -80, rotate: 25, delay: 0.1 },
  { x: -30, y: -60, rotate: -10, delay: 0.15 },
  { x: 30, y: -60, rotate: 15, delay: 0.2 },
];

export function StarBurst({ burstKey }: Props) {
  if (burstKey === 0) return null;
  return (
    <div className="star-burst" key={burstKey}>
      {OFFSETS.map((o, i) => (
        <span
          key={i}
          className="star-burst-item"
          style={
            {
              "--x": `${o.x}px`,
              "--y": `${o.y}px`,
              "--rotate": `${o.rotate}deg`,
              "--delay": `${o.delay}s`,
            } as React.CSSProperties
          }
        >
          ⭐️
        </span>
      ))}
    </div>
  );
}
