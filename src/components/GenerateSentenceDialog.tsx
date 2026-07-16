import { useState } from "react";
import type { SentenceDifficulty } from "../types";
import { DIFFICULTY_LABELS } from "../lib/sentencePractice";

interface Props {
  knownChars: Set<string>;
  onCancel: () => void;
  onConfirm: (targetChar: string, difficulty: SentenceDifficulty) => void;
}

const DIFFICULTY_OPTIONS: SentenceDifficulty[] = ["easy", "medium", "hard"];

export function GenerateSentenceDialog({ knownChars, onCancel, onConfirm }: Props) {
  const [charInput, setCharInput] = useState("");
  const [difficulty, setDifficulty] = useState<SentenceDifficulty>("medium");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    const trimmed = charInput.trim();
    if ([...trimmed].length !== 1) {
      setError("請只輸入一個漢字喔");
      return;
    }
    if (!knownChars.has(trimmed)) {
      setError(`「${trimmed}」還沒有學過，請先在「新增漢字」加入這個字`);
      return;
    }
    onConfirm(trimmed, difficulty);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(58, 46, 38, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        zIndex: 100,
      }}
      onClick={onCancel}
    >
      <div
        className="card"
        style={{ width: "100%", maxWidth: 360 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: "0 0 4px", fontSize: "1.2rem" }}>產生新句子</h2>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", marginTop: 0 }}>
          要練習哪個漢字？請輸入一個她已經學過的字。
        </p>

        <div className="field">
          <label>目標漢字</label>
          <input
            value={charInput}
            onChange={(e) => {
              setCharInput(e.target.value);
              setError(null);
            }}
            placeholder="例如：學"
            autoFocus
            style={{ fontSize: "1.4rem", textAlign: "center" }}
          />
        </div>

        <div className="field">
          <label>難度</label>
          <div style={{ display: "flex", gap: 8 }}>
            {DIFFICULTY_OPTIONS.map((d) => (
              <button
                key={d}
                className={d === difficulty ? "btn btn-primary" : "btn btn-outline"}
                style={{ flex: 1 }}
                onClick={() => setDifficulty(d)}
              >
                {DIFFICULTY_LABELS[d]}
              </button>
            ))}
          </div>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.8rem", marginBottom: 0 }}>
            難度越高，句子越長，念對了星星也越多。
          </p>
        </div>

        {error && <p style={{ color: "var(--color-danger)", fontSize: "0.9rem" }}>{error}</p>}

        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={onCancel}>
            取消
          </button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSubmit}>
            開始生成
          </button>
        </div>
      </div>
    </div>
  );
}
