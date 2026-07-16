import { useState } from "react";
import { Link } from "react-router-dom";
import type { CharacterDoc } from "../types";
import { pickReviewSession } from "../lib/review";
import { saveReviewResult } from "../lib/store";
import { playStarSound } from "../lib/sound";
import { Flashcard } from "../components/Flashcard";
import { StarBurst } from "../components/StarBurst";

const SESSION_SIZE = 10;

interface Props {
  characters: CharacterDoc[];
  familyCode: string;
}

export function ReviewPage({ characters, familyCode }: Props) {
  // Snapshot the session once on mount so it doesn't reshuffle mid-review as
  // each answer updates the underlying characters' due/box stats.
  const [session] = useState(() => pickReviewSession(characters, SESSION_SIZE));
  const [index, setIndex] = useState(0);
  const [starsEarned, setStarsEarned] = useState(0);
  const [burstKey, setBurstKey] = useState(0);
  const [busy, setBusy] = useState(false);

  if (characters.length === 0) {
    return (
      <div className="screen">
        <h1 className="page-title">複習</h1>
        <div className="empty-state card">
          <p>還沒有漢字可以複習喔，先去新增今天共讀繪本學到的字吧！</p>
          <Link to="/add" className="btn btn-primary" style={{ marginTop: 12 }}>
            ✏️ 新增漢字
          </Link>
        </div>
      </div>
    );
  }

  if (index >= session.length) {
    return (
      <div className="screen">
        <h1 className="page-title">複習完成！</h1>
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3rem" }}>🎉</div>
          <p style={{ fontSize: "1.1rem" }}>
            這次複習了 {session.length} 個字，得到 {starsEarned} 顆星星！
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <Link to="/" className="btn btn-outline" style={{ flex: 1 }}>
              回首頁
            </Link>
            <button
              className="btn btn-primary"
              style={{ flex: 1 }}
              onClick={() => {
                setIndex(0);
                setStarsEarned(0);
              }}
            >
              再複習一次
            </button>
          </div>
        </div>
      </div>
    );
  }

  const current = session[index];

  async function handleResult(correct: boolean) {
    if (busy) return;
    setBusy(true);
    if (correct) {
      setStarsEarned((s) => s + 1);
      setBurstKey((k) => k + 1);
      playStarSound();
    }
    try {
      await saveReviewResult(familyCode, current.id, correct);
    } finally {
      setIndex((i) => i + 1);
      setBusy(false);
    }
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
        <Flashcard character={current} />
        <StarBurst burstKey={burstKey} />
      </div>

      <p
        style={{
          textAlign: "center",
          color: "var(--color-text-muted)",
          margin: "16px 0",
        }}
      >
        請女兒念念看這個字，念對了嗎？
      </p>

      <div style={{ display: "flex", gap: 10 }}>
        <button
          className="btn btn-outline btn-block"
          disabled={busy}
          onClick={() => handleResult(false)}
        >
          🙈 還不太會
        </button>
        <button
          className="btn btn-primary btn-block"
          disabled={busy}
          onClick={() => handleResult(true)}
        >
          🎉 念對了！
        </button>
      </div>
    </div>
  );
}
