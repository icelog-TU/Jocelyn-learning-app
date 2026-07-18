import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import type { AffectionDoc, CharacterDoc, CollectedPrizeDoc, SentenceDoc } from "../types";
import { dateKey } from "../lib/characters";
import { countDueForReview } from "../lib/review";
import { computeTotalStars } from "../lib/sentencePractice";
import { computeAvailableStars } from "../lib/gachaCatalog";
import { speak } from "../lib/speech";

/** Reset styles so a <button> or <Link> can stand in for plain tappable
 * text/headings without looking like a button. */
const speakableStyle: CSSProperties = {
  background: "none",
  border: "none",
  padding: 0,
  margin: 0,
  font: "inherit",
  color: "inherit",
  textAlign: "left",
  cursor: "pointer",
  display: "block",
  width: "100%",
};

interface Props {
  characters: CharacterDoc[];
  sentences: SentenceDoc[];
  prizes: CollectedPrizeDoc[];
  affection: AffectionDoc[];
  familyCode: string;
  loading: boolean;
  onChangeFamilyCode: () => void;
}

export function HomePage({
  characters,
  sentences,
  prizes,
  affection,
  familyCode,
  loading,
  onChangeFamilyCode,
}: Props) {
  const totalStars = computeTotalStars(characters, sentences);
  const availableStars = computeAvailableStars(totalStars, prizes.length, affection);
  const todayKey = dateKey();
  const addedToday = characters.filter((c) => c.addedDateKey === todayKey).length;
  const dueSentenceCount = countDueForReview(sentences);

  const messageText =
    characters.length === 0
      ? "還沒有任何漢字，先去新增今天學到的字或詞彙吧！"
      : dueSentenceCount > 0
        ? `目前有 ${dueSentenceCount} 句適合複習囉`
        : "今天的句子都複習過了，可以自由複習或新增新字";

  return (
    <div className="screen">
      <h1 className="page-title" style={{ margin: "4px 0 16px" }}>
        <button
          type="button"
          style={{ ...speakableStyle, fontSize: "inherit", fontWeight: "inherit" }}
          onClick={() => speak("哈囉！今天也一起學漢字吧")}
        >
          哈囉！今天也一起學漢字吧
        </button>
      </h1>

      <div className="card" style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <Stat
          label="已學漢字／詞彙"
          value={loading ? "…" : characters.length}
          onTap={() => speak(loading ? "已學漢字／詞彙" : `已經學了 ${characters.length} 個漢字或詞彙`)}
        />
        <Stat
          label="今天新增"
          value={loading ? "…" : addedToday}
          onTap={() => speak(loading ? "今天新增" : `今天新增了 ${addedToday} 個`)}
        />
      </div>

      <div className="card" style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <Stat
          label="累積星星"
          value={loading ? "…" : totalStars}
          icon="⭐️"
          onTap={() => speak(loading ? "累積星星" : `累積星星，${totalStars} 顆`)}
        />
        <Stat
          label="可用星星"
          value={loading ? "…" : availableStars}
          icon="⭐️"
          onTap={() => speak(loading ? "可用星星" : `可用星星，${availableStars} 顆`)}
        />
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <button
          type="button"
          style={{ ...speakableStyle, fontWeight: 600, marginBottom: 12 }}
          onClick={() => speak(messageText)}
        >
          {messageText}
        </button>
        <div style={{ display: "flex", gap: 10 }}>
          <Link to="/add" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => speak("新增漢字／詞彙")}>
            ✏️ 新增漢字／詞彙
          </Link>
          <Link to="/sentences" className="btn btn-primary" style={{ flex: 1 }} onClick={() => speak("AI 造句練習")}>
            📝 AI 造句練習
          </Link>
        </div>
      </div>

      <Link
        to="/gacha"
        className="btn btn-outline btn-block"
        style={{ marginBottom: 16 }}
        onClick={() => speak("拿星星去轉蛋")}
      >
        🎁 拿星星去轉蛋！
      </Link>

      <p style={{ textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
        <button
          type="button"
          style={{ ...speakableStyle, display: "inline", width: "auto", color: "inherit" }}
          onClick={() => speak(`家庭代碼是 ${familyCode}`)}
        >
          家庭代碼：<strong>{familyCode}</strong>
        </button>
        {" · "}
        <button
          onClick={() => {
            speak("更換代碼");
            if (
              confirm(
                "確定要更換家庭代碼嗎？換成別組代碼之後，會看到那組代碼底下的漢字紀錄（現在這組代碼的紀錄不會被刪除，之後輸入回來還會在）。",
              )
            ) {
              onChangeFamilyCode();
            }
          }}
          style={{
            background: "none",
            border: "none",
            color: "var(--color-secondary)",
            fontWeight: 700,
            fontSize: "0.85rem",
            padding: 0,
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          更換代碼
        </button>
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
  onTap,
}: {
  label: string;
  value: number | string;
  icon?: string;
  onTap: () => void;
}) {
  return (
    <button type="button" style={{ ...speakableStyle, flex: 1, textAlign: "center" }} onClick={onTap}>
      <div style={{ fontSize: "1.6rem", fontWeight: 800 }}>
        {icon} {value}
      </div>
      <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{label}</div>
    </button>
  );
}
