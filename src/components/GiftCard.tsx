import "./GiftCard.css";
import type { GiftOption } from "../lib/gachaCatalog";
import { speak } from "../lib/speech";

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

// Read as "兩顆" not "二顆" — the correct measure-word form in spoken
// Mandarin — and generally as how a person would actually say small
// counts out loud, rather than digit-by-digit.
const CHINESE_COUNT: Record<number, string> = {
  0: "零",
  1: "一",
  2: "兩",
  3: "三",
  4: "四",
  5: "五",
  6: "六",
  7: "七",
  8: "八",
  9: "九",
  10: "十",
};

function toChineseCount(n: number): string {
  return CHINESE_COUNT[n] ?? String(n);
}

/** A gift as a big, icon-first card: the star cost and heart gain are shown
 * as repeated ⭐️/❤️ icons (not just "10★ → +4❤️" text), so a child who
 * can't read numbers yet can still see roughly "how much" and "how many".
 * Tapping the picture, the star row, or the heart row only explains what
 * they mean out loud — nothing is bought until "送出去！" is pressed, so a
 * child exploring the card by tapping around it can't accidentally spend
 * stars. */
export function GiftCard({ gift, affordable, disabled, onClick }: Props) {
  return (
    <div className={`gift-card${affordable ? " affordable" : " unaffordable"}`}>
      <button
        type="button"
        className="gift-card-picture"
        onClick={() => speak(`買${gift.label}`)}
        aria-label={`這是什麼：${gift.label}`}
      >
        <span className="gift-card-emoji">{gift.emoji}</span>
        <span className="gift-card-label">{gift.label}</span>
      </button>
      <button
        type="button"
        className="gift-card-icon-block"
        onClick={() => speak(`要花 ${toChineseCount(gift.cost)} 顆星星。`)}
        aria-label="要花幾顆星星"
      >
        {iconRows("⭐️", gift.cost).map((row, i) => (
          <span key={i} className="gift-card-row">
            {row}
          </span>
        ))}
      </button>
      <button
        type="button"
        className="gift-card-icon-block"
        onClick={() => speak(`會增加 ${toChineseCount(gift.hearts)} 顆愛心哦。`)}
        aria-label="會增加幾顆愛心"
      >
        {iconRows("❤️", gift.hearts).map((row, i) => (
          <span key={i} className="gift-card-row">
            {row}
          </span>
        ))}
      </button>
      <button
        type="button"
        className="gift-card-send"
        disabled={disabled}
        onClick={onClick}
        aria-label={`把${gift.label}送出去`}
      >
        送出去！
      </button>
    </div>
  );
}
