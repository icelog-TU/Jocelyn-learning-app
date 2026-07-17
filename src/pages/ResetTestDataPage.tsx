import { useState } from "react";
import { Link } from "react-router-dom";
import type { CharacterDoc, CollectedPrizeDoc, SentenceDoc } from "../types";
import { computeTotalStars } from "../lib/sentencePractice";
import { resetAllProgress } from "../lib/store";

interface Props {
  characters: CharacterDoc[];
  sentences: SentenceDoc[];
  prizes: CollectedPrizeDoc[];
  familyCode: string;
}

const CONFIRM_WORD = "重置";

/** Not linked from anywhere in the normal UI (no nav item, no button on any
 * other page) — only reachable by typing the URL directly — so a child
 * can't stumble into wiping progress by tapping around. Also gated behind
 * typing a confirmation word, so even an adult can't trigger it with one
 * accidental tap. */
export function ResetTestDataPage({ characters, sentences, prizes, familyCode }: Props) {
  const [confirmText, setConfirmText] = useState("");
  const [resetting, setResetting] = useState(false);
  const [done, setDone] = useState(false);

  const totalStars = computeTotalStars(characters, sentences);
  const canConfirm = confirmText.trim() === CONFIRM_WORD;

  async function handleReset() {
    if (!canConfirm || resetting) return;
    setResetting(true);
    try {
      await resetAllProgress(familyCode);
      setDone(true);
    } finally {
      setResetting(false);
    }
  }

  if (done) {
    return (
      <div className="screen">
        <h1 className="page-title">✅ 重置完成</h1>
        <div className="card">
          <p style={{ margin: 0 }}>
            星星、轉蛋收集跟每隻怪獸的好感度都已經歸零了。已經學過的漢字和句子都還在，不會受影響。
          </p>
        </div>
        <Link to="/" className="btn btn-primary btn-block" style={{ marginTop: 16 }}>
          回首頁
        </Link>
      </div>
    );
  }

  return (
    <div className="screen">
      <h1 className="page-title">⚠️ 重置測試資料</h1>

      <div className="card" style={{ marginBottom: 16 }}>
        <p style={{ margin: "0 0 12px", color: "var(--color-text-muted)" }}>
          這個頁面不會出現在一般的操作選單裡，是給大人手動測試用的。
        </p>
        <p style={{ fontWeight: 700, margin: "0 0 6px" }}>會被清空的：</p>
        <ul style={{ margin: "0 0 16px", paddingLeft: 20 }}>
          <li>累積星星（目前 {totalStars} 顆，會歸零）</li>
          <li>轉蛋收集到的怪獸（目前 {prizes.length} 隻，會全部清空）</li>
          <li>每隻怪獸的好感度</li>
        </ul>
        <p style={{ fontWeight: 700, margin: "0 0 6px" }}>不會受影響的：</p>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li>已經學過的漢字／詞彙（{characters.length} 個）</li>
          <li>已經存起來的句子（{sentences.length} 句）</li>
        </ul>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <p style={{ margin: "0 0 10px" }}>確定的話，請在下面輸入「{CONFIRM_WORD}」兩個字：</p>
        <input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={`輸入「${CONFIRM_WORD}」確認`}
          style={{ width: "100%", marginBottom: 12, boxSizing: "border-box" }}
        />
        <button className="btn btn-danger btn-block" disabled={!canConfirm || resetting} onClick={handleReset}>
          {resetting ? "重置中…" : "確認重置"}
        </button>
      </div>

      <Link to="/" className="btn btn-outline btn-block">
        取消，回首頁
      </Link>
    </div>
  );
}
