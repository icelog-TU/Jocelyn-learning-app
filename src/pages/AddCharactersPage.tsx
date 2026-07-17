import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { CharacterDoc, SentenceDifficulty, SentenceDoc } from "../types";
import { guessZhuyin, zhuyinCandidates } from "../lib/zhuyin";
import { saveCharacterBatch, saveSentenceBatch } from "../lib/store";
import {
  DIFFICULTY_LABELS,
  generateSentences,
  isSentencePracticeConfigured,
} from "../lib/sentencePractice";
import { SentencePracticeSession } from "../components/SentencePracticeSession";

const GENERATE_COUNT = 5;
const DIFFICULTY_OPTIONS: SentenceDifficulty[] = ["easy", "medium", "hard"];

interface Pending {
  hanzi: string;
  zhuyin: string;
  candidates: string[];
}

type GenPhase = "idle" | "generating" | "waiting-for-sync" | "error";

interface Props {
  familyCode: string;
  characters: CharacterDoc[];
  sentences: SentenceDoc[];
}

export function AddCharactersPage({ familyCode, characters, sentences }: Props) {
  const [rawInput, setRawInput] = useState("");
  const [pending, setPending] = useState<Pending | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedWord, setSavedWord] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<SentenceDifficulty>("medium");
  const [genPhase, setGenPhase] = useState<GenPhase>("idle");
  const [genError, setGenError] = useState<string | null>(null);
  const [practiceSession, setPracticeSession] = useState<SentenceDoc[] | null>(null);

  const generationMarkerRef = useRef(0);

  function handleAddFromInput() {
    const trimmed = rawInput.trim();
    const chars = Array.from(trimmed);
    if (chars.length === 0 || !chars.some((c) => /\p{Script=Han}/u.test(c))) return;

    const candidates = chars.length === 1 ? zhuyinCandidates(trimmed) : [guessZhuyin(trimmed)];
    setPending({ hanzi: trimmed, zhuyin: candidates[0], candidates });
    setRawInput("");
  }

  function updatePendingZhuyin(zhuyin: string) {
    setPending((p) => (p ? { ...p, zhuyin } : p));
  }

  async function handleSaveWord() {
    if (!pending) return;
    setSaving(true);
    try {
      await saveCharacterBatch(familyCode, [{ hanzi: pending.hanzi, zhuyin: pending.zhuyin }]);
      setSavedWord(pending.hanzi);
      setPending(null);
      setDifficulty("medium");
      setGenPhase("idle");
      setGenError(null);
      setPracticeSession(null);
    } finally {
      setSaving(false);
    }
  }

  function handleStartOver() {
    setSavedWord(null);
    setPracticeSession(null);
    setGenPhase("idle");
    setGenError(null);
  }

  async function handleGenerate() {
    if (!savedWord) return;
    setGenPhase("generating");
    setGenError(null);
    try {
      const knownCharsList = [
        ...new Set([...characters.flatMap((c) => Array.from(c.hanzi)), ...Array.from(savedWord)]),
      ];
      const newTexts = await generateSentences(knownCharsList, savedWord, difficulty, GENERATE_COUNT);
      if (newTexts.length === 0) {
        setGenPhase("error");
        setGenError(`這次沒有生成出用到「${savedWord}」的合適句子，可以再試一次看看！`);
        return;
      }
      generationMarkerRef.current = Date.now();
      await saveSentenceBatch(familyCode, newTexts, [savedWord], difficulty);
      setGenPhase("waiting-for-sync");
    } catch (err) {
      setGenPhase("error");
      setGenError(err instanceof Error ? err.message : "發生錯誤，請稍後再試一次");
    }
  }

  // After saving a freshly-generated batch, wait for the subscription to
  // reflect it (with real IDs) before starting the practice session.
  useEffect(() => {
    if (genPhase !== "waiting-for-sync" || !savedWord) return;
    const fresh = sentences.filter(
      (s) => s.createdAt >= generationMarkerRef.current && s.sourceChars[0] === savedWord,
    );
    if (fresh.length > 0) {
      setPracticeSession(fresh.slice(0, GENERATE_COUNT));
      setGenPhase("idle");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genPhase, sentences, savedWord]);

  if (practiceSession) {
    return (
      <div className="screen">
        <h1 className="page-title">練習「{savedWord}」的句子</h1>
        <SentencePracticeSession
          key={practiceSession.map((s) => s.id).join(",")}
          session={practiceSession}
          familyCode={familyCode}
          completionActions={
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <Link to="/history" className="btn btn-outline" style={{ flex: 1 }}>
                查看紀錄
              </Link>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleStartOver}>
                ➕ 新增下一個
              </button>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="screen">
      <h1 className="page-title">新增漢字／詞彙</h1>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="field" style={{ marginBottom: 8 }}>
          <label>輸入今天學到的一個漢字或詞彙</label>
          <input
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddFromInput();
            }}
            placeholder="例如：學 或 毛毛蟲"
          />
        </div>
        <button className="btn btn-secondary btn-block" onClick={handleAddFromInput}>
          加入
        </button>
      </div>

      {pending && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <div style={{ fontSize: "2rem", minWidth: 48, textAlign: "center" }}>
              {pending.hanzi}
            </div>
            <div style={{ flex: 1 }}>
              {pending.candidates.length > 1 ? (
                <select
                  value={pending.zhuyin}
                  onChange={(e) => updatePendingZhuyin(e.target.value)}
                  style={{ width: "100%", padding: 10, borderRadius: 12, fontSize: "1rem" }}
                >
                  {pending.candidates.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={pending.zhuyin}
                  onChange={(e) => updatePendingZhuyin(e.target.value)}
                  style={{ fontSize: "1rem" }}
                />
              )}
            </div>
            <button
              onClick={() => setPending(null)}
              aria-label="取消"
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
          <button
            className="btn btn-primary btn-block"
            disabled={saving}
            onClick={handleSaveWord}
          >
            {saving ? "儲存中…" : "儲存"}
          </button>
        </div>
      )}

      {savedWord && (
        <div className="card" style={{ marginBottom: 16 }}>
          <p style={{ margin: "0 0 12px", fontWeight: 700 }}>✅ 已新增「{savedWord}」</p>

          {!isSentencePracticeConfigured ? (
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
              AI 造句練習還沒設定好，請看 README 設定 Cloudflare Worker 後就能為這個字產生練習句子。
            </p>
          ) : genPhase === "generating" || genPhase === "waiting-for-sync" ? (
            <p style={{ textAlign: "center", padding: "12px 0" }}>AI 出題中，請稍等一下…</p>
          ) : (
            <>
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

              {genError && <p style={{ color: "var(--color-danger)", fontSize: "0.9rem" }}>{genError}</p>}

              <button className="btn btn-primary btn-block" onClick={handleGenerate}>
                🪄 產生 5 句練習句子
              </button>
            </>
          )}

          <button
            onClick={handleStartOver}
            style={{
              background: "none",
              border: "none",
              display: "block",
              margin: "12px auto 0",
              fontSize: "0.85rem",
              color: "var(--color-text-muted)",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            略過，直接新增下一個
          </button>
        </div>
      )}
    </div>
  );
}
