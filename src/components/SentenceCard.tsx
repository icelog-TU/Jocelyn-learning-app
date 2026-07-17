import type { ReactNode } from "react";
import { zhuyinForSentence } from "../lib/zhuyin";
import { speak } from "../lib/speech";

interface Props {
  sentence: string;
  /** Rendered in the same row as "聽整句", right next to it, so related
   * audio controls (e.g. the record button) sit at the same height instead
   * of being scrolled far away from each other. */
  extraActions?: ReactNode;
}

export function SentenceCard({ sentence, extraActions }: Props) {
  const chars = zhuyinForSentence(sentence);

  return (
    <div className="card" style={{ textAlign: "center", padding: "32px 20px" }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          rowGap: 16,
          columnGap: 4,
          marginBottom: 20,
        }}
      >
        {chars.map((c, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1rem", color: "var(--color-secondary)", fontWeight: 700 }}>
              {c.zhuyin}
            </div>
            <div style={{ fontSize: "2.6rem", fontWeight: 700, lineHeight: 1.1 }}>{c.char}</div>
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
