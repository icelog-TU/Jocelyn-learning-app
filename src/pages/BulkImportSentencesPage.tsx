import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { CharacterDoc, SentenceDifficulty } from "../types";
import { DIFFICULTY_LABELS } from "../lib/sentencePractice";
import { saveSentenceBatch } from "../lib/store";

const DIFFICULTY_OPTIONS: SentenceDifficulty[] = ["easy", "medium", "hard"];

interface Props {
  familyCode: string;
  /** Already-learned characters — used to warn (not block) when a pasted
   * line contains a character the child hasn't learned yet. */
  characters: CharacterDoc[];
}

interface ParsedLine {
  text: string;
  unknownChars: string[];
}

function parseLines(raw: string, knownChars: Set<string>): ParsedLine[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((text) => {
      const unknownChars = [
        ...new Set(Array.from(text).filter((c) => /\p{Script=Han}/u.test(c) && !knownChars.has(c))),
      ];
      return { text, unknownChars };
    });
}

/** Bypasses AI generation entirely: the parent pastes/types sentences she
 * wrote herself (one per line), using characters the child already knows,
 * and they're saved straight into the live sentence bank — ready to be
 * picked up by 隨機複習 — instead of going through the AI-generation flow,
 * whose sentence quality wasn't good enough for real practice material. */
export function BulkImportSentencesPage({ familyCode, characters }: Props) {
  const [raw, setRaw] = useState("");
  const [difficulty, setDifficulty] = useState<SentenceDifficulty>("medium");
  const [saving, setSaving] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  const knownChars = useMemo(() => new Set(characters.flatMap((c) => Array.from(c.hanzi))), [characters]);
  const lines = useMemo(() => parseLines(raw, knownChars), [raw, knownChars]);
  const linesWithUnknown = lines.filter((l) => l.unknownChars.length > 0);

  async function handleImport() {
    if (lines.length === 0) return;
    setSaving(true);
    try {
      await saveSentenceBatch(
        familyCode,
        lines.map((l) => ({ text: l.text, origin: "user" })),
        [],
        difficulty,
      );
      setResultMsg(`✅ 已經匯入 ${lines.length} 句，可以在「隨機複習」抽到了！`);
      setRaw("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="screen">
      <h1 className="page-title">📥 批次匯入句子</h1>
      <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginTop: -8, marginBottom: 16 }}>
        不透過 AI，直接貼上你自己寫好的句子（一行一句），會直接存進句子庫，可以在「隨機複習」抽到。適合拿已經學過的
        200 多個字自由造句，品質比 AI 現場生成更穩定。
      </p>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="field">
          <label>難度（整批套用同一個難度，之後也可以在「管理句子庫」個別修改）</label>
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
        </div>

        <div className="field" style={{ marginTop: 12 }}>
          <label>句子（一行一句）</label>
          <textarea
            value={raw}
            onChange={(e) => {
              setRaw(e.target.value);
              setResultMsg(null);
            }}
            rows={8}
            placeholder={"一行一句，例如：\n爸爸帶我去公園玩。\n媽媽在家裡看書。"}
            style={{
              width: "100%",
              fontSize: "1.1rem",
              padding: 10,
              borderRadius: 12,
              border: "2px solid #eee0d0",
              fontFamily: "inherit",
              resize: "vertical",
            }}
          />
        </div>

        {lines.length > 0 && (
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", margin: "8px 0 0" }}>
            目前有 {lines.length} 句準備匯入。
          </p>
        )}

        {linesWithUnknown.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <p style={{ color: "var(--color-danger)", fontSize: "0.85rem", margin: "0 0 4px" }}>
              ⚠️ 這幾句用到還沒學過的字，還是可以匯入，但建議確認一下：
            </p>
            {linesWithUnknown.map((l, i) => (
              <p key={i} style={{ fontSize: "0.85rem", margin: "2px 0", color: "var(--color-text-muted)" }}>
                「{l.text}」— 不認識：{l.unknownChars.join("、")}
              </p>
            ))}
          </div>
        )}

        <button
          className="btn btn-primary btn-block"
          style={{ marginTop: 12 }}
          disabled={saving || lines.length === 0}
          onClick={handleImport}
        >
          {saving ? "匯入中…" : `批次匯入這 ${lines.length} 句`}
        </button>

        {resultMsg && (
          <p style={{ color: "var(--color-success)", fontSize: "0.9rem", margin: "10px 0 0" }}>{resultMsg}</p>
        )}
      </div>

      <Link to="/history" className="btn btn-outline btn-block" style={{ marginTop: 4 }}>
        回學習紀錄
      </Link>
    </div>
  );
}
