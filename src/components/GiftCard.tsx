import "./GiftCard.css";
import type { GiftOption } from "../lib/gachaCatalog";

interface Props {
  gift: GiftOption;
  affordable: boolean;
  disabled: boolean;
  onClick: () => void;
}

const ICONS_PER_ROW = 5;

/** Splits a repeated-icon count into rows of at most ICONS_PER_ROW, so a
 * gift costing e.g. 10 stars renders as two neat rows of 5 instead of one
 * long row that overflows the card. */
function iconRows(icon: string, count: number): string[] {
  const rows: string[] = [];
  for (let i = 0; i < count; i += ICONS_PER_ROW) {
    rows.push(icon.repeat(Math.min(ICONS_PER_ROW, count - i)));
  }
  return rows;
}

/** A gift as a big, icon-first card: the star cost and heart gain are shown
 * as repeated ⭐️/❤️ icons (not just "10★ → +4❤️" text), so a child who
 * can't read numbers yet can still see roughly "how much" and "how many". */
export function GiftCard({ gift, affordable, disabled, onClick }: Props) {
  return (
    <button
      className={`gift-card${affordable ? " affordable" : " unaffordable"}`}
      disabled={disabled}
      onClick={onClick}
      aria-label={`${gift.label}，${gift.cost} 顆星星換 ${gift.hearts} 顆愛心`}
    >
      <span className="gift-card-emoji">{gift.emoji}</span>
      <span className="gift-card-label">{gift.label}</span>
      <span className="gift-card-icon-block">
        {iconRows("⭐️", gift.cost).map((row, i) => (
          <span key={i} className="gift-card-row">
            {row}
          </span>
        ))}
      </span>
      <span className="gift-card-icon-block">
        {iconRows("❤️", gift.hearts).map((row, i) => (
          <span key={i} className="gift-card-row">
            {row}
          </span>
        ))}
      </span>
    </button>
  );
}
