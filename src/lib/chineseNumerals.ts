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

export function toChineseCount(n: number): string {
  return CHINESE_COUNT[n] ?? String(n);
}
