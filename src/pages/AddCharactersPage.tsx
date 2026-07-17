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
import { SentenceDraftEditor, type DraftEntry } from "../components/SentenceDraftEditor";

const GENERATE_COUNT = 5;
const DIFFICULTY_OPTIONS: SentenceDifficulty[] = ["easy", "medium", "hard"];

interface Pending {
  hanzi: string;
  zhuyin: string;
  candidates: string[];
}

interface Props {
  familyCode: string;
  characters: CharacterDoc[];
  sentences: SentenceDoc[];
  weakChars: Set<string>;
  onToggleWeakChar: (char: string) => void;
}

function draftKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function AddCharactersPage({
  familyCode,
  characters,
  sentences,
  weakChars,
  onToggleWeakChar,
}: Props) {
  const [rawInput, setRawInput] = useState("");
  const [pending, setPending] = useState<Pending | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedWord, setSavedWord] = useState<string | null>(null);
  const [alreadyKnown, setAlreadyKnown] = useState(false);
  const [difficulty, setDifficulty] = useState<SentenceDifficulty>("medium");
  const [drafts, setDrafts] = useState<DraftEntry[] | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [savingDrafts, setSavingDrafts] = useState(false);
  const [practiceSession, setPracticeSession] = useState<SentenceDoc[] | null>(null);

  const generationMarkerRef = useRef(0);

  function handleAddFromInput() {
    const trimmed = rawInput.trim();
    const chars = Array.from(trimmed);
    if (chars.length === 0 || !chars.some((c) => /\p{Script=Han}/u.test(c))) return;

    // Already learned this exact hanzi/word — don't log a duplicate entry,
    // just jump straight to generating more practice sentences for it.
    if (characters.some((c) => c.hanzi === trimmed)) {
      setPending(null);
      setSavedWord(trimmed);
      setAlreadyKnown(true);
      setDifficulty("medium");
      setDrafts(null);
      setGenError(null);
      setPracticeSession(null);
      setRawInput("");
      return;
    }

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
      setAlreadyKnown(false);
      setPending(null);
      setDifficulty("medium");
      setDrafts(null);
      setGenError(null);
      setPracticeSession(null);
    } finally {
      setSaving(false);
    }
  }

  function handleStartOver() {
    setSavedWord(null);
    setAlreadyKnown(false);
    setDrafts(null);
    setGenError(null);
    setPracticeSession(null);
  }

  async function handleGenerate() {
    if (!savedWord) return;
    setGenerating(true);
    setGenError(null);
    try {
      const knownCharsList = [
        ...new Set([...characters.flatMap((c) => Array.from(c.hanzi)), ...Array.from(savedWord)]),
      ];
      const referenceSentences = sentences
        .filter((s) => s.sourceChars[0] === savedWord && (s.origin === "user" || s.origin === "edited"))
        .map((s) => s.text)
        .slice(0, 5);
      const newTexts = await generateSentences(
        knownCharsList,
        savedWord,
        difficulty,
        GENERATE_COUNT,
        [...weakChars],
        referenceSentences,
      );
      if (newTexts.length === 0) {
        setGenError(`這次沒有生成出用到「${savedWord}」的合適句子，可以再試一次，或是自己寫句子！`);
        return;
      }
      const aiDrafts: DraftEntry[] = newTexts.map((text) => ({ key: draftKey(), text, origin: "ai" }));
      setDrafts((prev) => {
        // Keep anything the parent already wrote or edited; only replace the
        // untouched AI lines with the fresh batch.
        const kept = (prev ?? []).filter((d) => d.origin !== "ai");
        return [...kept, ...aiDrafts];
      });
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "發生錯誤，請稍後再試一次");
    } finally {
      setGenerating(false);
    }
  }

  function handleWriteOwn() {
    setGenError(null);
    setDrafts((prev) => prev ?? []);
  }

  function handleUpdateDraftText(key: string, text: string) {
    setDrafts((prev) =>
      prev
        ? prev.map((d) => (d.key === key ? { ...d, text, origin: d.origin === "ai" ? "edited" : d.origin } : d))
        : prev,
    );
  }

  function handleRemoveDraft(key: string) {
    setDrafts((prev) => (prev ? prev.filter((d) => d.key !== key) : prev));
  }

  function handleAddDraft(text: string) {
    setDrafts((prev) => [...(prev ?? []), { key: draftKey(), text, origin: "user" }]);
  }

  async function handleConfirmDrafts() {
    if (!savedWord || !drafts || drafts.length === 0) return;
    setSavingDrafts(true);
    try {
      generationMarkerRef.current = Date.now();
      await saveSentenceBatch(
        familyCode,
        drafts.map((d) => ({ text: d.text, origin: d.origin })),
        [savedWord],
        difficulty,
      );
    } finally {
      setSavingDrafts(false);
    }
  }

  // After confirming drafts, wait for the subscription to reflect the saved
  // batch (with real IDs) before starting the practice session.
  useEffect(() => {
    if (!savedWord || generationMarkerRef.current === 0 || practiceSession) return;
    const fresh = sentences.filter(
      (s) => s.createdAt >= generationMarkerRef.current && s.sourceChars[0] === savedWord,
    );
    if (fresh.length > 0) {
      setPracticeSession(fresh);
      generationMarkerRef.current = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentences, savedWord, practiceSession]);

  if (practiceSession) {
    return (
      <div className="screen">
        <h1 className="page-title">練習「{savedWord}」的句子</h1>
        <SentencePracticeSession
          key={practiceSession.map((s) => s.id).join(",")}
          session={practiceSession}
          familyCode={familyCode}
          weakChars={weakChars}
          onToggleWeakChar={onToggleWeakChar}
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
          <p style={{ margin: "0 0 12px", fontWeight: 700 }}>
            {alreadyKnown ? `📚 「${savedWord}」已經學過囉，一起來造句練習吧！` : `✅ 已新增「${savedWord}」`}
          </p>

          {drafts !== null ? (
            <SentenceDraftEditor
              drafts={drafts}
              onUpdateText={handleUpdateDraftText}
              onRemove={handleRemoveDraft}
              onAdd={handleAddDraft}
              onConfirm={handleConfirmDrafts}
              onRegenerate={isSentencePracticeConfigured ? handleGenerate : undefined}
              regenerating={generating}
              saving={savingDrafts}
            />
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

              <div style={{ display: "flex", gap: 10 }}>
                {isSentencePracticeConfigured && (
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    disabled={generating}
                    onClick={handleGenerate}
                  >
                    {generating ? "AI 出題中…" : "🪄 產生 5 句練習句子"}
                  </button>
                )}
                <button className="btn btn-outline" style={{ flex: 1 }} onClick={handleWriteOwn}>
                  ✍️ 自己寫句子
                </button>
              </div>
              {!isSentencePracticeConfigured && (
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", marginTop: 10 }}>
                  AI 造句還沒設定好（見 README），但還是可以自己寫句子來練習。
                </p>
              )}
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
