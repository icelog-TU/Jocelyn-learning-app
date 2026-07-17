import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import type { CharacterDoc, SentenceDifficulty, SentenceDoc } from "../types";
import { pickReviewSession } from "../lib/review";
import { generateSentences, isSentencePracticeConfigured } from "../lib/sentencePractice";
import { saveSentenceBatch } from "../lib/store";
import { SentencePracticeSession } from "../components/SentencePracticeSession";
import { GenerateSentenceDialog } from "../components/GenerateSentenceDialog";
import { SentenceDraftEditor, type DraftEntry } from "../components/SentenceDraftEditor";

const SESSION_SIZE = 10;
const GENERATE_COUNT = 5;

type Phase = "idle" | "empty" | "generating" | "drafting" | "waiting-for-sync" | "ready" | "error";

interface Props {
  characters: CharacterDoc[];
  sentences: SentenceDoc[];
  sentencesLoading: boolean;
  familyCode: string;
  weakChars: Set<string>;
  onToggleWeakChar: (char: string) => void;
}

function draftKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function SentencePracticePage({
  characters,
  sentences,
  sentencesLoading,
  familyCode,
  weakChars,
  onToggleWeakChar,
}: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [session, setSession] = useState<SentenceDoc[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [prefillChar, setPrefillChar] = useState<string | undefined>(undefined);
  const [drafts, setDrafts] = useState<DraftEntry[]>([]);
  const [draftTarget, setDraftTarget] = useState<string | null>(null);
  const [draftDifficulty, setDraftDifficulty] = useState<SentenceDifficulty>("medium");
  const [savingDrafts, setSavingDrafts] = useState(false);

  const initializedRef = useRef(false);
  const generationMarkerRef = useRef(0);
  const prefillHandledRef = useRef(false);
  // Weak chars are, by definition, already-learned content, so they count
  // as "known" even if manually added without a separate CharacterDoc entry.
  const knownChars = new Set([...characters.flatMap((c) => Array.from(c.hanzi)), ...weakChars]);
  const location = useLocation();

  // Arriving from a weak-char "🪄 造句" link opens the dialog pre-filled
  // with that character so it doesn't have to be retyped.
  useEffect(() => {
    const target = (location.state as { prefillChar?: string } | null)?.prefillChar;
    if (target && !prefillHandledRef.current) {
      prefillHandledRef.current = true;
      setPrefillChar(target);
      setShowDialog(true);
    }
  }, [location.state]);

  async function runGenerate(targetText: string, difficulty: SentenceDifficulty) {
    setPhase("generating");
    setError(null);
    try {
      const knownCharsList = [...knownChars];
      const referenceSentences = sentences
        .filter((s) => s.sourceChars[0] === targetText && (s.origin === "user" || s.origin === "edited"))
        .map((s) => s.text)
        .slice(0, 5);
      const newTexts = await generateSentences(
        knownCharsList,
        targetText,
        difficulty,
        GENERATE_COUNT,
        [...weakChars],
        referenceSentences,
      );
      if (newTexts.length === 0) {
        setPhase("drafting");
        setError(`這次沒有生成出用到「${targetText}」的合適句子，可以再試一次，或是自己寫句子！`);
        return;
      }
      const aiDrafts: DraftEntry[] = newTexts.map((text) => ({ key: draftKey(), text, origin: "ai" }));
      setDrafts((prev) => [...prev.filter((d) => d.origin !== "ai"), ...aiDrafts]);
      setPhase("drafting");
    } catch (err) {
      setPhase("drafting");
      setError(err instanceof Error ? err.message : "發生錯誤，請稍後再試一次");
    }
  }

  function handleGenerateFromDialog(targetText: string, difficulty: SentenceDifficulty) {
    setShowDialog(false);
    setDrafts([]);
    setDraftTarget(targetText);
    setDraftDifficulty(difficulty);
    runGenerate(targetText, difficulty);
  }

  function handleRegenerate() {
    if (!draftTarget) return;
    runGenerate(draftTarget, draftDifficulty);
  }

  function handleUpdateDraftText(key: string, text: string) {
    setDrafts((prev) =>
      prev.map((d) => (d.key === key ? { ...d, text, origin: d.origin === "ai" ? "edited" : d.origin } : d)),
    );
  }

  function handleRemoveDraft(key: string) {
    setDrafts((prev) => prev.filter((d) => d.key !== key));
  }

  function handleAddDraft(text: string) {
    setDrafts((prev) => [...prev, { key: draftKey(), text, origin: "user" }]);
  }

  async function handleConfirmDrafts() {
    if (!draftTarget || drafts.length === 0) return;
    setSavingDrafts(true);
    try {
      generationMarkerRef.current = Date.now();
      await saveSentenceBatch(
        familyCode,
        drafts.map((d) => ({ text: d.text, origin: d.origin })),
        [draftTarget],
        draftDifficulty,
      );
      setPhase("waiting-for-sync");
    } finally {
      setSavingDrafts(false);
    }
  }

  // First load: reuse the existing bank if there's anything in it, otherwise
  // show the empty state so the parent can pick a character to start with.
  useEffect(() => {
    if (sentencesLoading || initializedRef.current || !isSentencePracticeConfigured) return;
    initializedRef.current = true;
    if (sentences.length === 0) {
      setPhase("empty");
    } else {
      setSession(pickReviewSession(sentences, SESSION_SIZE));
      setPhase("ready");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentencesLoading, sentences]);

  // After confirming drafts, wait for the subscription to reflect the saved
  // batch (with real IDs) before starting the session.
  useEffect(() => {
    if (phase !== "waiting-for-sync") return;
    const fresh = sentences.filter((s) => s.createdAt >= generationMarkerRef.current);
    if (fresh.length > 0) {
      setSession(fresh.slice(0, SESSION_SIZE));
      setPhase("ready");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, sentences]);

  function openDialog() {
    setPrefillChar(undefined);
    setShowDialog(true);
  }

  const dialog = showDialog && (
    <GenerateSentenceDialog
      knownChars={knownChars}
      onCancel={() => {
        setShowDialog(false);
        setPrefillChar(undefined);
      }}
      onConfirm={handleGenerateFromDialog}
      initialChar={prefillChar}
    />
  );

  if (!isSentencePracticeConfigured) {
    return (
      <div className="screen">
        <h1 className="page-title">AI 句子練習</h1>
        <div className="card">
          <p>這個功能還沒設定好。需要架一個 Cloudflare Worker 來安全地串接 AI，請看專案 README 的說明設定。</p>
        </div>
      </div>
    );
  }

  if (characters.length === 0) {
    return (
      <div className="screen">
        <h1 className="page-title">AI 句子練習</h1>
        <div className="empty-state card">
          <p>還沒有漢字可以拿來造句喔，先去新增今天學到的字或詞彙吧！</p>
          <Link to="/add" className="btn btn-primary" style={{ marginTop: 12 }}>
            ✏️ 新增漢字／詞彙
          </Link>
        </div>
      </div>
    );
  }

  if (phase === "drafting") {
    return (
      <div className="screen">
        <h1 className="page-title">練習「{draftTarget}」的句子</h1>
        {error && <p style={{ color: "var(--color-danger)", fontSize: "0.9rem" }}>{error}</p>}
        <SentenceDraftEditor
          drafts={drafts}
          onUpdateText={handleUpdateDraftText}
          onRemove={handleRemoveDraft}
          onAdd={handleAddDraft}
          onConfirm={handleConfirmDrafts}
          onRegenerate={handleRegenerate}
          saving={savingDrafts}
        />
      </div>
    );
  }

  if (phase === "empty") {
    return (
      <div className="screen">
        <h1 className="page-title">AI 句子練習</h1>
        <div className="empty-state card">
          <p>還沒有句子喔！挑一個她學過的字或詞彙，讓 AI 圍繞它造 5 句話練習，或是自己寫句子。</p>
          <button className="btn btn-primary btn-block" style={{ marginTop: 12 }} onClick={openDialog}>
            🪄 產生新句子
          </button>
        </div>
        {dialog}
      </div>
    );
  }

  if (phase === "idle" || phase === "generating" || phase === "waiting-for-sync") {
    return (
      <div className="screen">
        <h1 className="page-title">AI 句子練習</h1>
        <div className="card" style={{ textAlign: "center", padding: "48px 20px" }}>
          <p>AI 出題中，請稍等一下…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <h1 className="page-title">AI 句子練習</h1>
      <SentencePracticeSession
        key={session.map((s) => s.id).join(",")}
        session={session}
        familyCode={familyCode}
        weakChars={weakChars}
        onToggleWeakChar={onToggleWeakChar}
        completionActions={
          <>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <Link to="/" className="btn btn-outline" style={{ flex: 1 }}>
                回首頁
              </Link>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={openDialog}>
                🪄 產生新句子
              </button>
            </div>
            <Link
              to="/sentences/manage"
              style={{
                display: "block",
                marginTop: 16,
                fontSize: "0.85rem",
                color: "var(--color-secondary)",
              }}
            >
              管理已存的句子（編輯／刪除）
            </Link>
          </>
        }
        activeFooter={
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 12,
              marginTop: 16,
            }}
          >
            <button
              onClick={openDialog}
              style={{
                background: "none",
                border: "none",
                fontSize: "0.85rem",
                color: "var(--color-text-muted)",
                cursor: "pointer",
                textDecoration: "underline",
                padding: 0,
              }}
            >
              產生新句子
            </button>
            <Link
              to="/sentences/manage"
              style={{
                fontSize: "0.85rem",
                color: "var(--color-text-muted)",
              }}
            >
              管理已存的句子
            </Link>
          </div>
        }
      />
      {dialog}
    </div>
  );
}
