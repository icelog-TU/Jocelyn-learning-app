import "./GiftCard.css";
import type { GiftOption } from "../lib/gachaCatalog";

interface Props {
  gift: GiftOption;
  affordable: boolean;
  disabled: boolean;
  onClick: () => void;
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
      <span className="gift-card-row">{"⭐️".repeat(gift.cost)}</span>
      <span className="gift-card-row">{"❤️".repeat(gift.hearts)}</span>
    </button>
  );
}
