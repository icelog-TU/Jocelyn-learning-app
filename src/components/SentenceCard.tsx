import type { ReactNode } from "react";
import { zhuyinForSentence, type AnnotatedChar } from "../lib/zhuyin";
import { speak } from "../lib/speech";

interface Props {
  sentence: string;
  /** Manually-chosen column-break positions (character offsets into
   * `sentence`); see SentenceDoc.lineBreaks. Falls back to mechanical
   * fixed-length chunking when absent. */
  lineBreaks?: number[];
  /** Rendered in the same row as "聽整句", right next to it, so related
   * audio controls (e.g. the record button) sit at the same height instead
   * of being scrolled far away from each other. */
  extraActions?: ReactNode;
}

const FULLWIDTH_PUNCTUATION = new Set(["，", "。", "！", "？", "、"]);

/** Tone marks are always the last character pinyin-zhuyin appends to a
 * syllable's zhuyin string (2nd/3rd/4th tone, or the neutral-tone dot).
 * Printed books render these as a small diacritic beside the phonetic
 * symbols, not as another full-size symbol, so we split it out and
 * position it separately. */
const TONE_MARKS = new Set(["ˊ", "ˇ", "ˋ", "˙"]);

function splitZhuyin(zhuyin: string): { base: string[]; tone?: string } {
  const chars = Array.from(zhuyin);
  const last = chars[chars.length - 1];
  if (chars.length > 1 && TONE_MARKS.has(last)) {
    return { base: chars.slice(0, -1), tone: last };
  }
  return { base: chars };
}

/** Max characters per reading column before wrapping to the next column
 * (to the left), matching how a printed page of vertical Chinese text
 * breaks into columns rather than one endless line. Also used as a safety
 * cap on manually-set segments, in case one runs unexpectedly long. */
const COLUMN_SIZE = 6;

function chunkIntoColumns(chars: AnnotatedChar[], lineBreaks?: number[]): AnnotatedChar[][] {
  const columns: AnnotatedChar[][] = [];
  const breaks =
    lineBreaks && lineBreaks.length > 0
      ? [...new Set(lineBreaks)].filter((b) => b > 0 && b < chars.length).sort((a, b) => a - b)
      : [];
  const bounds = [0, ...breaks, chars.length];
  for (let b = 0; b < bounds.length - 1; b++) {
    const segment = chars.slice(bounds[b], bounds[b + 1]);
    for (let i = 0; i < segment.length; i += COLUMN_SIZE) {
      columns.push(segment.slice(i, i + COLUMN_SIZE));
    }
  }
  return columns;
}

export function SentenceCard({ sentence, lineBreaks, extraActions }: Props) {
  const columns = chunkIntoColumns(zhuyinForSentence(sentence), lineBreaks);

  return (
    <div className="card" style={{ textAlign: "center", padding: "24px 16px" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "row-reverse",
          alignItems: "flex-start",
          justifyContent: "center",
          gap: 10,
          overflowX: "auto",
          maxWidth: "100%",
          margin: "0 auto 20px",
          padding: "4px 2px",
        }}
      >
        {columns.map((col, ci) => (
          <div key={ci} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            {col.map((c, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 2 }}>
                <span
                  style={{
                    fontSize: "2.2rem",
                    fontWeight: 700,
                    lineHeight: 1,
                    // Full-width CJK punctuation glyphs (，。！？、) sit near
                    // the top of their character box by font-design
                    // convention, so without this they visually "float"
                    // above the baseline the surrounding hanzi sit on.
                    transform: FULLWIDTH_PUNCTUATION.has(c.char) ? "translateY(0.5em)" : undefined,
                  }}
                >
                  {c.char}
                </span>
                {c.zhuyin &&
                  (() => {
                    const { base, tone } = splitZhuyin(c.zhuyin);
                    return (
                      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
                        {tone === "˙" && (
                          <span
                            aria-hidden
                            style={{
                              position: "absolute",
                              top: -14,
                              left: "50%",
                              transform: "translateX(-50%)",
                              fontSize: "1rem",
                              color: "var(--color-secondary)",
                              fontWeight: 700,
                              lineHeight: 1,
                            }}
                          >
                            {tone}
                          </span>
                        )}
                        {base.map((symbol, si) => (
                          <span
                            key={si}
                            style={{
                              fontSize: "0.68rem",
                              color: "var(--color-secondary)",
                              fontWeight: 700,
                              lineHeight: 1.2,
                            }}
                          >
                            {symbol}
                          </span>
                        ))}
                        {tone && tone !== "˙" && (
                          <span
                            aria-hidden
                            style={{
                              position: "absolute",
                              top: "50%",
                              right: -12,
                              transform: "translateY(-50%)",
                              fontSize: "1rem",
                              color: "var(--color-secondary)",
                              fontWeight: 700,
                              lineHeight: 1,
                            }}
                          >
                            {tone}
                          </span>
                        )}
                      </div>
                    );
                  })()}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <button className="btn btn-outline" onClick={() => speak(sentence, { rate: 0.8 })} aria-label="播放整句發音">
          🔊 聽整句
        </button>
        {extraActions}
      </div>
    </div>
  );
}
