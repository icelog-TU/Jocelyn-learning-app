import { useState } from "react";
import { Link } from "react-router-dom";
import type { SentenceDoc, SentenceDifficulty, SentenceOrigin } from "../types";
import { editSentenceDifficulty, editSentenceLineBreaks, editSentenceText, removeSentence } from "../lib/store";
import { DIFFICULTY_LABELS, DIFFICULTY_ORDER } from "../lib/sentencePractice";

const ORIGIN_LABELS: Record<SentenceOrigin, string> = {
  ai: "AI",
  user: "你寫的",
  edited: "你修改過",
};

interface Props {
  sentences: SentenceDoc[];
  familyCode: string;
}

export function SentenceManagePage({ sentences, familyCode }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [breakEditId, setBreakEditId] = useState<string | null>(null);

  function startEdit(s: SentenceDoc) {
    setEditingId(s.id);
    setDraft(s.text);
  }

  async function saveEdit(id: string) {
    const trimmed = draft.trim();
    if (trimmed) {
      await editSentenceText(familyCode, id, trimmed);
    }
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("確定要刪除這句話嗎？")) return;
    await removeSentence(familyCode, id);
  }

  return (
    <div className="screen">
      <h1 className="page-title">管理句子庫</h1>
      <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginTop: -8 }}>
        句子不自然或不合理的話，可以在這裡直接修改文字，或刪掉讓 AI 之後不會再選到它。
      </p>

      {sentences.length === 0 && (
        <div className="empty-state card">還沒有任何句子，去「新增」或「複習」頁面讓 AI 生成第一批吧！</div>
      )}

      {sentences.map((s) => (
        <div className="card" key={s.id} style={{ marginBottom: 12 }}>
          {editingId === s.id ? (
            <>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={2}
                style={{
                  width: "100%",
                  fontSize: "1.1rem",
                  padding: 10,
                  borderRadius: 12,
                  border: "2px solid #eee0d0",
                }}
                autoFocus
              />
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setEditingId(null)}>
                  取消
                </button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => saveEdit(s.id)}>
                  儲存
                </button>
              </div>
            </>
          ) : breakEditId === s.id ? (
            <LineBreakEditor sentence={s} familyCode={familyCode} onDone={() => setBreakEditId(null)} />
          ) : (
            <>
              <p style={{ fontSize: "1.3rem", margin: "0 0 10px" }}>{s.text}</p>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                {s.sourceChars[0] && <span className="pill">衍生自「{s.sourceChars[0]}」</span>}
                <select
                  value={s.difficulty ?? "medium"}
                  onChange={(e) => editSentenceDifficulty(familyCode, s.id, e.target.value as SentenceDifficulty)}
                  aria-label="修改難度"
                  className="pill"
                  style={{ border: "none", cursor: "pointer", font: "inherit" }}
                >
                  {DIFFICULTY_ORDER.map((d) => (
                    <option key={d} value={d}>
                      {DIFFICULTY_LABELS[d]}
                    </option>
                  ))}
                </select>
                <span className="pill">{ORIGIN_LABELS[s.origin ?? "ai"]}</span>
                <span className="pill">{"★".repeat(Math.min(s.stats.box, 5))}</span>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 10 }}>
                <button className="btn btn-outline" onClick={() => setBreakEditId(s.id)}>
                  ✂️ 調整換行
                </button>
                <div style={{ flex: 1 }} />
                <button className="btn btn-outline" onClick={() => startEdit(s)}>
                  ✏️ 修改
                </button>
                <button className="btn btn-danger" onClick={() => handleDelete(s.id)}>
                  🗑 刪除
                </button>
              </div>
            </>
          )}
        </div>
      ))}

      <Link to="/sentences" className="btn btn-outline btn-block" style={{ marginTop: 8 }}>
        回句子練習
      </Link>
    </div>
  );
}

/** Lets a parent fix awkward automatic line breaks (e.g. "一隻" / "大黑狗"
 * split apart) by tapping the gap between two characters to mark a manual
 * column break there, instead of the mechanical fixed-length chunking. */
function LineBreakEditor({
  sentence,
  familyCode,
  onDone,
}: {
  sentence: SentenceDoc;
  familyCode: string;
  onDone: () => void;
}) {
  const chars = Array.from(sentence.text);
  const [breaks, setBreaks] = useState<Set<number>>(new Set(sentence.lineBreaks ?? []));
  const [saving, setSaving] = useState(false);

  function toggle(i: number) {
    setBreaks((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      await editSentenceLineBreaks(familyCode, sentence.id, [...breaks].sort((a, b) => a - b));
      onDone();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <p style={{ fontWeight: 700, margin: "0 0 6px" }}>✂️ 調整換行</p>
      <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", margin: "0 0 12px" }}>
        點兩個字中間的縫隙，設定要在哪裡換行。
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center" }}>
        {chars.map((c, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center" }}>
            {i > 0 && (
              <button
                onClick={() => toggle(i)}
                aria-label={breaks.has(i) ? "取消在這裡換行" : "在這裡換行"}
                style={{
                  width: breaks.has(i) ? 6 : 16,
                  height: 32,
                  margin: "0 1px",
                  padding: 0,
                  border: "none",
                  borderRadius: 3,
                  cursor: "pointer",
                  background: breaks.has(i) ? "var(--color-primary)" : "transparent",
                }}
              />
            )}
            <span style={{ fontSize: "1.4rem" }}>{c}</span>
          </span>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button className="btn btn-outline" style={{ flex: 1 }} onClick={onDone}>
          取消
        </button>
        <button className="btn btn-primary" style={{ flex: 1 }} disabled={saving} onClick={handleSave}>
          {saving ? "儲存中…" : "儲存換行"}
        </button>
      </div>
    </>
  );
}
