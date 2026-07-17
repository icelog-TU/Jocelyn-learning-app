import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { CharacterDoc, SentenceDifficulty, SentenceDoc } from "../types";
import { pickReviewSession } from "../lib/review";
import { generateSentences, isSentencePracticeConfigured } from "../lib/sentencePractice";
import { saveSentenceBatch } from "../lib/store";
import { SentencePracticeSession } from "../components/SentencePracticeSession";
import { GenerateSentenceDialog } from "../components/GenerateSentenceDialog";

const SESSION_SIZE = 10;
const GENERATE_COUNT = 5;

type Phase = "idle" | "empty" | "generating" | "waiting-for-sync" | "ready" | "error";

interface Props {
  characters: CharacterDoc[];
  sentences: SentenceDoc[];
  sentencesLoading: boolean;
  familyCode: string;
}

export function SentencePracticePage({
  characters,
  sentences,
  sentencesLoading,
  familyCode,
}: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [session, setSession] = useState<SentenceDoc[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const initializedRef = useRef(false);
  const generationMarkerRef = useRef(0);
  const knownChars = new Set(characters.flatMap((c) => Array.from(c.hanzi)));

  async function handleGenerate(targetText: string, difficulty: SentenceDifficulty) {
    setShowDialog(false);
    setPhase("generating");
    setError(null);
    try {
      const knownCharsList = [...knownChars];
      const newTexts = await generateSentences(
        knownCharsList,
        targetText,
        difficulty,
        GENERATE_COUNT,
      );
      if (newTexts.length === 0) {
        setPhase("error");
        setError(`這次沒有生成出用到「${targetText}」的合適句子，換一個字再試試看！`);
        return;
      }
      generationMarkerRef.current = Date.now();
      await saveSentenceBatch(familyCode, newTexts, [targetText], difficulty);
      setPhase("waiting-for-sync");
    } catch (err) {
      setPhase("error");
      setError(err instanceof Error ? err.message : "發生錯誤，請稍後再試一次");
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

  // After saving a freshly-generated batch, wait for the subscription to
  // reflect it (with real IDs) before starting the session.
  useEffect(() => {
    if (phase !== "waiting-for-sync") return;
    const fresh = sentences.filter((s) => s.createdAt >= generationMarkerRef.current);
    if (fresh.length > 0) {
      setSession(fresh.slice(0, SESSION_SIZE));
      setPhase("ready");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, sentences]);

  const dialog = showDialog && (
    <GenerateSentenceDialog
      knownChars={knownChars}
      onCancel={() => setShowDialog(false)}
      onConfirm={handleGenerate}
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

  if (phase === "error") {
    return (
      <div className="screen">
        <h1 className="page-title">AI 句子練習</h1>
        <div className="card">
          <p style={{ color: "var(--color-danger)" }}>{error}</p>
          <button
            className="btn btn-primary btn-block"
            style={{ marginTop: 12 }}
            onClick={() => setShowDialog(true)}
          >
            重試一次
          </button>
        </div>
        {dialog}
      </div>
    );
  }

  if (phase === "empty") {
    return (
      <div className="screen">
        <h1 className="page-title">AI 句子練習</h1>
        <div className="empty-state card">
          <p>還沒有句子喔！挑一個她學過的字或詞彙，讓 AI 圍繞它造 5 句話練習。</p>
          <button
            className="btn btn-primary btn-block"
            style={{ marginTop: 12 }}
            onClick={() => setShowDialog(true)}
          >
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
        completionActions={
          <>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <Link to="/" className="btn btn-outline" style={{ flex: 1 }}>
                回首頁
              </Link>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() => setShowDialog(true)}
              >
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
              onClick={() => setShowDialog(true)}
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
