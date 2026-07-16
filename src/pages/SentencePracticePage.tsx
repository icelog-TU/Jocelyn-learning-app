import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { CharacterDoc } from "../types";
import { generateSentences, isSentencePracticeConfigured } from "../lib/sentencePractice";
import { saveSentenceSession } from "../lib/store";
import { SentenceCard } from "../components/SentenceCard";
import { StarBurst } from "../components/StarBurst";

const SESSION_SIZE = 5;
const STARS_PER_SENTENCE = 3;

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

interface Props {
  characters: CharacterDoc[];
  familyCode: string;
}

export function SentencePracticePage({ characters, familyCode }: Props) {
  const [sentences, setSentences] = useState<string[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [starsEarned, setStarsEarned] = useState(0);
  const [burstKey, setBurstKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const isComplete = sentences !== null && index >= sentences.length;

  useEffect(() => {
    if (!isComplete || saved || starsEarned === 0) return;
    setSaved(true);
    saveSentenceSession(familyCode, starsEarned).catch(() => {});
  }, [isComplete, saved, starsEarned, familyCode]);

  useEffect(() => {
    if (!isSentencePracticeConfigured || characters.length === 0) return;
    let cancelled = false;
    const knownChars = [...new Set(characters.map((c) => c.hanzi))];

    generateSentences(knownChars, SESSION_SIZE)
      .then((result) => {
        if (!cancelled) setSentences(result);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  if (loadError) {
    return (
      <div className="screen">
        <h1 className="page-title">AI 句子練習</h1>
        <div className="card">
          <p style={{ color: "var(--color-danger)" }}>{loadError}</p>
        </div>
      </div>
    );
  }

  if (sentences === null) {
    return (
      <div className="screen">
        <h1 className="page-title">AI 句子練習</h1>
        <div className="card" style={{ textAlign: "center", padding: "48px 20px" }}>
          <p>AI 出題中，請稍等一下…</p>
        </div>
      </div>
    );
  }

  if (sentences.length === 0) {
    return (
      <div className="screen">
        <h1 className="page-title">AI 句子練習</h1>
        <div className="card">
          <p>這次沒有生成出合適的句子，可能是漢字還不夠多，再多學幾個字之後再試試看！</p>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="screen">
        <h1 className="page-title">句子練習完成！</h1>
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3rem" }}>🎉</div>
          <p style={{ fontSize: "1.1rem" }}>
            這次念了 {sentences.length} 句，得到 {starsEarned} 顆星星！
          </p>
          <Link to="/" className="btn btn-primary btn-block" style={{ marginTop: 16 }}>
            回首頁
          </Link>
        </div>
      </div>
    );
  }

  const current = sentences[index];

  function handleCorrect() {
    if (busy) return;
    setBusy(true);
    setStarsEarned((s) => s + STARS_PER_SENTENCE);
    setBurstKey((k) => k + 1);
    speakPraise();
    setTimeout(() => {
      setIndex((i) => i + 1);
      setBusy(false);
    }, 900);
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
          {index + 1} / {sentences.length}
        </span>
        <span className="pill">⭐️ {starsEarned}</span>
      </div>

      <div style={{ position: "relative" }}>
        <SentenceCard sentence={current} />
        <StarBurst burstKey={burstKey} />
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
    </div>
  );
}
