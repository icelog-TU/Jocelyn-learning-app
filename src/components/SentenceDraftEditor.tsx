import { useState } from "react";
import type { SentenceOrigin } from "../types";

export interface DraftEntry {
  key: string;
  text: string;
  origin: SentenceOrigin;
}

interface Props {
  drafts: DraftEntry[];
  onUpdateText: (key: string, text: string) => void;
  onRemove: (key: string) => void;
  onAdd: (text: string) => void;
  onConfirm: () => void;
  onRegenerate?: () => void;
  regenerating?: boolean;
  saving?: boolean;
  /** Confirm-button label, as a function of the current draft count (so
   * callers can phrase it for their own flow — e.g. "開始練習這 N 句" for
   * immediate practice vs. a "存進老師準備區" phrasing for staging content
   * ahead of time). Defaults to the practice-flow phrasing. */
  confirmLabel?: (count: number) => string;
}

const ORIGIN_LABELS: Record<SentenceOrigin, string> = {
  ai: "AI",
  user: "你寫的",
  edited: "你修改過",
};

/** Lets the parent review AI-drafted sentences before they're saved: edit
 * any line's text, delete ones they don't like, and add their own. Starting
 * with an empty `drafts` list lets someone skip AI entirely and write every
 * sentence themselves. */
export function SentenceDraftEditor({
  drafts,
  onUpdateText,
  onRemove,
  onAdd,
  onConfirm,
  onRegenerate,
  regenerating,
  saving,
  confirmLabel,
}: Props) {
  const [newText, setNewText] = useState("");

  function handleAdd() {
    const trimmed = newText.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setNewText("");
  }

  return (
    <div>
      <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginTop: 0 }}>
        檢查看看這幾句，可以直接修改文字、刪除不要的，或加入你自己覺得更好的句子。
      </p>

      {drafts.length === 0 && (
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
          目前還沒有句子，在下面自己寫一句吧！
        </p>
      )}

      {drafts.map((d) => (
        <div className="card" key={d.key} style={{ marginBottom: 10, padding: 12 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <textarea
              value={d.text}
              onChange={(e) => onUpdateText(d.key, e.target.value)}
              rows={2}
              style={{
                flex: 1,
                fontSize: "1.05rem",
                padding: 10,
                borderRadius: 12,
                border: "2px solid #eee0d0",
                fontFamily: "inherit",
                resize: "none",
              }}
            />
            <button
              onClick={() => onRemove(d.key)}
              aria-label="刪除這句"
              style={{
                background: "none",
                border: "none",
                fontSize: "1.2rem",
                color: "var(--color-text-muted)",
                cursor: "pointer",
                padding: 4,
              }}
            >
              ✕
            </button>
          </div>
          <span className="pill" style={{ fontSize: "0.7rem", marginTop: 8 }}>
            {ORIGIN_LABELS[d.origin]}
          </span>
        </div>
      ))}

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
          placeholder="自己寫一句加進去"
        />
        <button className="btn btn-secondary" onClick={handleAdd}>
          加入
        </button>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        {onRegenerate && (
          <button
            className="btn btn-outline"
            style={{ flex: 1 }}
            onClick={onRegenerate}
            disabled={regenerating}
          >
            {regenerating ? "生成中…" : "🪄 換一批 AI 句子"}
          </button>
        )}
        <button
          className="btn btn-primary"
          style={{ flex: 1 }}
          onClick={onConfirm}
          disabled={drafts.length === 0 || saving}
        >
          {saving ? "儲存中…" : (confirmLabel ?? ((n) => `開始練習這 ${n} 句`))(drafts.length)}
        </button>
      </div>
    </div>
  );
}
