import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { CharacterDoc, SentenceDoc } from "../types";
import { pickPriorityCharacters, pickReviewSession } from "../lib/review";
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

type Phase = "idle" | "generating" | "waiting-for-sync" | "ready" | "error";

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

  async function handleGenerate() {
    setPhase("generating");
    setError(null);
    try {
      const knownChars = [...new Set(characters.map((c) => c.hanzi))];
      const priorityChars = pickPriorityCharacters(characters);
      const newTexts = await generateSentences(knownChars, priorityChars, GENERATE_COUNT);
      if (newTexts.length === 0) {
        setPhase("error");
        setError("這次沒有生成出合適的句子，可能是漢字還不夠多，再多學幾個字之後再試試看！");
        return;
      }
      generationMarkerRef.current = Date.now();
      await saveSentenceBatch(familyCode, newTexts, priorityChars);
      setPhase("waiting-for-sync");
    } catch (err) {
      setPhase("error");
      setError(err instanceof Error ? err.message : "發生錯誤，請稍後再試一次");
    }
  }

  // First load: reuse the existing bank if there's anything in it, otherwise
  // kick off an initial generation automatically.
  useEffect(() => {
    if (sentencesLoading || initializedRef.current || !isSentencePracticeConfigured) return;
    initializedRef.current = true;
    if (sentences.length === 0) {
      void handleGenerate();
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
          <button className="btn btn-primary btn-block" style={{ marginTop: 12 }} onClick={handleGenerate}>
            重試一次
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
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleGenerate}>
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

      <Link
        to="/sentences/manage"
        style={{
          display: "block",
          textAlign: "center",
          marginTop: 16,
          fontSize: "0.85rem",
          color: "var(--color-text-muted)",
        }}
      >
        管理已存的句子
      </Link>
    </div>
  );
}
