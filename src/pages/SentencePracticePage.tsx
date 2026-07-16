import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { CharacterDoc, SentenceDoc } from "../types";
import { pickReviewSession } from "../lib/review";
import {
  generateSentences,
  isSentencePracticeConfigured,
  STARS_PER_SENTENCE,
} from "../lib/sentencePractice";
import { saveSentenceBatch, saveSentenceReviewResult } from "../lib/store";
import { playStarSound } from "../lib/sound";
import { SentenceCard } from "../components/SentenceCard";
import { StarBurst } from "../components/StarBurst";
import { RecordButton } from "../components/RecordButton";

const SESSION_SIZE = 10;
const GENERATE_COUNT = 5;

const PRAISE_PHRASES = [
  "哇～你好棒！",
  "太厲害了！",
  "念得好清楚喔！",
  "你是小天才！",
  "超級棒的！",
  "念得好流利！",
];

function speakPraise() {
  if (!("speechSynthesis" in window)) return;
  const phrase = PRAISE_PHRASES[Math.floor(Math.random() * PRAISE_PHRASES.length)];
  const utterance = new SpeechSynthesisUtterance(phrase);
  utterance.lang = "zh-TW";
  utterance.rate = 1;
  utterance.pitch = 1.3;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

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
  const [index, setIndex] = useState(0);
  const [starsEarned, setStarsEarned] = useState(0);
  const [burstKey, setBurstKey] = useState(0);
  const [busy, setBusy] = useState(false);

  const initializedRef = useRef(false);
  const generationMarkerRef = useRef(0);

  /** Asks which character to build sentences around; validates it's a single
   * character she's actually learned. Returns null if cancelled/invalid. */
  function promptForTargetChar(): string | null {
    const input = window.prompt("要練習哪個漢字？請輸入一個她已經學過的字，例如「學」");
    if (input === null) return null;
    const trimmed = input.trim();
    if ([...trimmed].length !== 1) {
      alert("請只輸入一個漢字喔");
      return null;
    }
    const known = new Set(characters.map((c) => c.hanzi));
    if (!known.has(trimmed)) {
      alert(`「${trimmed}」還沒有學過，請先在「新增漢字」加入這個字，再回來練習造句`);
      return null;
    }
    return trimmed;
  }

  async function handleGenerate(targetChar: string) {
    setPhase("generating");
    setError(null);
    try {
      const knownChars = [...new Set(characters.map((c) => c.hanzi))];
      const newTexts = await generateSentences(knownChars, targetChar, GENERATE_COUNT);
      if (newTexts.length === 0) {
        setPhase("error");
        setError(`這次沒有生成出用到「${targetChar}」的合適句子，換一個字再試試看！`);
        return;
      }
      generationMarkerRef.current = Date.now();
      await saveSentenceBatch(familyCode, newTexts, [targetChar]);
      setPhase("waiting-for-sync");
    } catch (err) {
      setPhase("error");
      setError(err instanceof Error ? err.message : "發生錯誤，請稍後再試一次");
    }
  }

  function handleGenerateClick() {
    const targetChar = promptForTargetChar();
    if (targetChar) void handleGenerate(targetChar);
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
      setIndex(0);
      setStarsEarned(0);
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
      setIndex(0);
      setStarsEarned(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, sentences]);

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
          <p>還沒有漢字可以拿來造句喔，先去新增今天共讀繪本學到的字吧！</p>
          <Link to="/add" className="btn btn-primary" style={{ marginTop: 12 }}>
            ✏️ 新增漢字
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
            onClick={handleGenerateClick}
          >
            重試一次
          </button>
        </div>
      </div>
    );
  }

  if (phase === "empty") {
    return (
      <div className="screen">
        <h1 className="page-title">AI 句子練習</h1>
        <div className="empty-state card">
          <p>還沒有句子喔！挑一個她學過的字，讓 AI 圍繞這個字造 5 句話練習。</p>
          <button
            className="btn btn-primary btn-block"
            style={{ marginTop: 12 }}
            onClick={handleGenerateClick}
          >
            🪄 產生新句子
          </button>
        </div>
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

  const isComplete = index >= session.length;

  if (isComplete) {
    return (
      <div className="screen">
        <h1 className="page-title">句子練習完成！</h1>
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3rem" }}>🎉</div>
          <p style={{ fontSize: "1.1rem" }}>
            這次念了 {session.length} 句，得到 {starsEarned} 顆星星！
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <Link to="/" className="btn btn-outline" style={{ flex: 1 }}>
              回首頁
            </Link>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleGenerateClick}>
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
        </div>
      </div>
    );
  }

  const current = session[index];

  async function handleCorrect() {
    if (busy) return;
    setBusy(true);
    setStarsEarned((s) => s + STARS_PER_SENTENCE);
    setBurstKey((k) => k + 1);
    playStarSound();
    speakPraise();
    try {
      await saveSentenceReviewResult(familyCode, current.id, true);
    } finally {
      setTimeout(() => {
        setIndex((i) => i + 1);
        setBusy(false);
      }, 900);
    }
  }

  function handleSkip() {
    if (busy) return;
    setIndex((i) => i + 1);
  }

  return (
    <div className="screen">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <span className="pill">
          {index + 1} / {session.length}
        </span>
        <span className="pill">⭐️ {starsEarned}</span>
      </div>

      <div style={{ position: "relative" }}>
        <SentenceCard sentence={current.text} />
        <StarBurst burstKey={burstKey} />
      </div>

      <div style={{ textAlign: "center", margin: "16px 0" }}>
        <RecordButton key={current.id} />
      </div>

      <p style={{ textAlign: "center", color: "var(--color-text-muted)", margin: "16px 0" }}>
        請她把整句話念出來，念對了嗎？
      </p>

      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn btn-outline btn-block" disabled={busy} onClick={handleSkip}>
          先跳過
        </button>
        <button className="btn btn-primary btn-block" disabled={busy} onClick={handleCorrect}>
          🎉 我念對了！
        </button>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 12,
          marginTop: 16,
        }}
      >
        <button
          onClick={handleGenerateClick}
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
    </div>
  );
}
