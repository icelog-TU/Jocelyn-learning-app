import { useState } from "react";
import type { NewCharacterInput } from "../types";
import { guessZhuyin, zhuyinCandidates } from "../lib/zhuyin";
import { saveCharacterBatch } from "../lib/store";

interface PendingChar extends NewCharacterInput {
  key: string;
  candidates: string[];
}

interface Props {
  familyCode: string;
}

function splitToChars(input: string): string[] {
  return Array.from(input)
    .map((c) => c.trim())
    .filter((c) => c.length > 0 && /\p{Script=Han}/u.test(c));
}

export function AddCharactersPage({ familyCode }: Props) {
  const [bookTitle, setBookTitle] = useState("");
  const [rawInput, setRawInput] = useState("");
  const [pending, setPending] = useState<PendingChar[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  function handleAddFromInput() {
    const chars = splitToChars(rawInput);
    if (chars.length === 0) return;

    setPending((prev) => {
      const seenHanzi = new Set(prev.map((p) => p.hanzi));
      const additions: PendingChar[] = [];
      for (const c of chars) {
        if (seenHanzi.has(c)) continue;
        seenHanzi.add(c);
        const candidates = zhuyinCandidates(c);
        additions.push({
          key: `${c}-${Date.now()}-${Math.random()}`,
          hanzi: c,
          zhuyin: candidates[0] ?? guessZhuyin(c),
          candidates,
        });
      }
      return [...prev, ...additions];
    });
    setRawInput("");
  }

  function updateZhuyin(key: string, zhuyin: string) {
    setPending((prev) => prev.map((p) => (p.key === key ? { ...p, zhuyin } : p)));
  }

  function removePending(key: string) {
    setPending((prev) => prev.filter((p) => p.key !== key));
  }

  async function handleSave() {
    if (pending.length === 0) return;
    setSaving(true);
    try {
      await saveCharacterBatch(
        familyCode,
        pending.map(({ hanzi, zhuyin }) => ({ hanzi, zhuyin })),
        bookTitle,
      );
      setSavedMessage(`已儲存 ${pending.length} 個新漢字！`);
      setPending([]);
      setBookTitle("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="screen">
      <h1 className="page-title">新增今天的漢字</h1>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="field">
          <label>今天共讀的繪本（選填）</label>
          <input
            value={bookTitle}
            onChange={(e) => setBookTitle(e.target.value)}
            placeholder="例如：好餓的毛毛蟲"
          />
        </div>
        <div className="field" style={{ marginBottom: 8 }}>
          <label>輸入今天學到的漢字</label>
          <input
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddFromInput();
            }}
            placeholder="可以一次貼上好幾個字，例如：毛毛蟲蘋果"
          />
        </div>
        <button className="btn btn-secondary btn-block" onClick={handleAddFromInput}>
          加入清單
        </button>
      </div>

      {pending.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <p style={{ fontWeight: 700, marginTop: 0 }}>今天預計新增（{pending.length}）</p>
          {pending.map((p) => (
            <div
              key={p.key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 0",
                borderBottom: "1px solid #f1e6d8",
              }}
            >
              <div style={{ fontSize: "2rem", width: 48, textAlign: "center" }}>{p.hanzi}</div>
              <div style={{ flex: 1 }}>
                {p.candidates.length > 1 ? (
                  <select
                    value={p.zhuyin}
                    onChange={(e) => updateZhuyin(p.key, e.target.value)}
                    style={{ width: "100%", padding: 10, borderRadius: 12, fontSize: "1rem" }}
                  >
                    {p.candidates.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={p.zhuyin}
                    onChange={(e) => updateZhuyin(p.key, e.target.value)}
                    style={{ fontSize: "1rem" }}
                  />
                )}
              </div>
              <button
                onClick={() => removePending(p.key)}
                aria-label="移除"
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.3rem",
                  color: "var(--color-text-muted)",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            className="btn btn-primary btn-block"
            style={{ marginTop: 16 }}
            disabled={saving}
            onClick={handleSave}
          >
            {saving ? "儲存中…" : `儲存今天的 ${pending.length} 個漢字`}
          </button>
        </div>
      )}

      {savedMessage && (
        <div className="card" style={{ textAlign: "center", background: "#eafbf1" }}>
          🎉 {savedMessage}
        </div>
      )}
    </div>
  );
}
