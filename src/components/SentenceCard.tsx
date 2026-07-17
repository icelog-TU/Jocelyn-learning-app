import type { ReactNode } from "react";
import { zhuyinForSentence, type AnnotatedChar } from "../lib/zhuyin";
import { speak } from "../lib/speech";

interface Props {
  sentence: string;
  /** Rendered in the same row as "聽整句", right next to it, so related
   * audio controls (e.g. the record button) sit at the same height instead
   * of being scrolled far away from each other. */
  extraActions?: ReactNode;
}

const FULLWIDTH_PUNCTUATION = new Set(["，", "。", "！", "？", "、"]);

/** Max characters per reading column before wrapping to the next column
 * (to the left), matching how a printed page of vertical Chinese text
 * breaks into columns rather than one endless line. */
const COLUMN_SIZE = 6;

function chunkIntoColumns(chars: AnnotatedChar[]): AnnotatedChar[][] {
  const columns: AnnotatedChar[][] = [];
  for (let i = 0; i < chars.length; i += COLUMN_SIZE) {
    columns.push(chars.slice(i, i + COLUMN_SIZE));
  }
  return columns;
}

export function SentenceCard({ sentence, extraActions }: Props) {
  const columns = chunkIntoColumns(zhuyinForSentence(sentence));

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
                {c.zhuyin && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    {Array.from(c.zhuyin).map((symbol, si) => (
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
                  </div>
                )}
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
