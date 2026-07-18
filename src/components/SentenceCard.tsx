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
  /** When set, every character renders as a tappable button (used by the
   * "find the character" / "which animal read it right" games) instead of
   * plain text — called with the tapped character's index into
   * `Array.from(sentence)` and the character itself. */
  onCharTap?: (index: number, char: string) => void;
  /** Character index to highlight karaoke-style (e.g. the one currently
   * being read aloud). */
  activeIndex?: number | null;
  /** Character index to briefly flash red (a wrong guess). */
  shakeIndex?: number | null;
  /** Character index to mark green (the correctly-found one). */
  foundIndex?: number | null;
  /** Character index to pulse blue (e.g. "I don't know this one, can you
   * teach me?" in the teach-the-animal game). */
  askingIndex?: number | null;
  /** Character index to pulse red (actively recording — press-and-hold in
   * progress). */
  recordingIndex?: number | null;
  /** Called on press-down / press-up (mouse or touch) for a character, e.g.
   * to record while held rather than requiring a separate button. Renders
   * that character as a button even without `onCharTap`. */
  onCharPressStart?: (index: number, char: string) => void;
  onCharPressEnd?: (index: number, char: string) => void;
  /** Character index to render as an empty slot (no glyph/zhuyin shown) —
   * the "fill in the blank" game's drop target. `blankSlotRef` receives the
   * slot's DOM node so the game can hit-test a drag against it. */
  blankIndex?: number | null;
  blankSlotRef?: (el: HTMLElement | null) => void;
}

/** Unicode's plain punctuation codepoints (，。「」etc.) are designed for
 * *horizontal* text, so fonts draw them hugging a corner of their em-box
 * (e.g. bottom-left, matching where a comma sits at the end of a horizontal
 * line). Unicode separately defines "presentation forms for vertical text"
 * for exactly this case — dedicated codepoints that real CJK fonts (Noto
 * Sans TC, PingFang TC, Microsoft JhengHei) draw already centered (commas,
 * full stops) or already hugging the correct edge to frame a column (corner
 * brackets), because that's their whole purpose. Since this component lays
 * out characters manually (not via CSS `writing-mode: vertical-rl`, which
 * would trigger this glyph substitution automatically), we substitute the
 * vertical forms ourselves at render time. Only affects display — the
 * underlying sentence text and zhuyin lookups keep using the plain forms. */
const VERTICAL_PUNCTUATION_FORMS: Record<string, string> = {
  "，": "﹐",
  "、": "﹑",
  "。": "﹒",
  "：": "﹕",
  "；": "﹔",
  "！": "﹗",
  "？": "﹖",
  "「": "﹁",
  "」": "﹂",
  "『": "﹃",
  "』": "﹄",
};

function verticalGlyph(char: string): string {
  return VERTICAL_PUNCTUATION_FORMS[char] ?? char;
}

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

export function SentenceCard({
  sentence,
  lineBreaks,
  extraActions,
  onCharTap,
  activeIndex,
  shakeIndex,
  foundIndex,
  askingIndex,
  recordingIndex,
  onCharPressStart,
  onCharPressEnd,
  blankIndex,
  blankSlotRef,
}: Props) {
  const columns = chunkIntoColumns(zhuyinForSentence(sentence), lineBreaks);
  let flatIndex = -1;

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
          userSelect: "none",
        }}
      >
        {columns.map((col, ci) => (
          <div key={ci} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            {col.map((c, i) => {
              flatIndex += 1;
              const charIndex = flatIndex;
              const isBlank = charIndex === blankIndex;
              const charClass = [
                charIndex === activeIndex ? "char-active" : "",
                charIndex === shakeIndex ? "char-shake" : "",
                charIndex === foundIndex ? "char-found" : "",
                charIndex === askingIndex ? "char-asking" : "",
                charIndex === recordingIndex ? "char-recording" : "",
                isBlank ? "char-blank" : "",
              ]
                .filter(Boolean)
                .join(" ");
              const interactive = Boolean(onCharTap || onCharPressStart);
              const RowTag = interactive ? "button" : "div";
              const rowProps = interactive
                ? {
                    type: "button" as const,
                    onClick: onCharTap ? () => onCharTap(charIndex, c.char) : undefined,
                    onPointerDown: onCharPressStart ? () => onCharPressStart(charIndex, c.char) : undefined,
                    onPointerUp: onCharPressEnd ? () => onCharPressEnd(charIndex, c.char) : undefined,
                    onPointerLeave: onCharPressEnd ? () => onCharPressEnd(charIndex, c.char) : undefined,
                    onPointerCancel: onCharPressEnd ? () => onCharPressEnd(charIndex, c.char) : undefined,
                    "aria-label": `這個字是「${c.char}」`,
                    style: {
                      display: "flex",
                      flexDirection: "row" as const,
                      alignItems: "center",
                      gap: 2,
                      background: "none",
                      border: "none",
                      padding: 4,
                      font: "inherit",
                      cursor: "pointer",
                      touchAction: "none" as const,
                    },
                  }
                : {
                    style: { display: "flex", flexDirection: "row" as const, alignItems: "center", gap: 2 },
                  };
              if (isBlank) {
                return (
                  <div
                    key={i}
                    ref={blankSlotRef}
                    className={charClass || undefined}
                    aria-label="這裡缺一個字"
                    style={{
                      width: "2.2rem",
                      height: "2.2rem",
                      border: "3px dashed var(--color-secondary)",
                      borderRadius: 10,
                    }}
                  />
                );
              }
              return (
              <RowTag key={i} className={charClass || undefined} {...rowProps}>
                <span
                  style={{
                    fontSize: "2.2rem",
                    fontWeight: 700,
                    lineHeight: 1,
                  }}
                >
                  {verticalGlyph(c.char)}
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
                              left: "100%",
                              marginLeft: 2,
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
              </RowTag>
              );
            })}
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
