import { Link } from "react-router-dom";
import type { AffectionDoc, CharacterDoc, CollectedPrizeDoc, SentenceDoc } from "../types";
import { dateKey } from "../lib/characters";
import { countDueForReview } from "../lib/review";
import { computeTotalStars } from "../lib/sentencePractice";
import { computeAvailableStars } from "../lib/gachaCatalog";

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

  return (
    <div className="screen">
      <h1 className="page-title">哈囉！今天也一起學漢字吧</h1>

      <div className="card" style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <Stat label="已學漢字／詞彙" value={loading ? "…" : characters.length} />
        <Stat label="今天新增" value={loading ? "…" : addedToday} />
      </div>

      <div className="card" style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <Stat label="累積星星" value={loading ? "…" : totalStars} icon="⭐️" />
        <Stat label="可用星星" value={loading ? "…" : availableStars} icon="⭐️" />
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <p style={{ margin: "0 0 12px", fontWeight: 600 }}>
          {characters.length === 0
            ? "還沒有任何漢字，先去新增今天學到的字或詞彙吧！"
            : dueSentenceCount > 0
              ? `目前有 ${dueSentenceCount} 句適合複習囉`
              : "今天的句子都複習過了，可以自由複習或新增新字"}
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <Link to="/add" className="btn btn-secondary" style={{ flex: 1 }}>
            ✏️ 新增漢字／詞彙
          </Link>
          <Link to="/sentences" className="btn btn-primary" style={{ flex: 1 }}>
            📝 AI 造句練習
          </Link>
        </div>
      </div>

      <Link to="/gacha" className="btn btn-outline btn-block" style={{ marginBottom: 16 }}>
        🎁 拿星星去轉蛋！
      </Link>

      <p style={{ textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
        家庭代碼：<strong>{familyCode}</strong>
        {" · "}
        <button
          onClick={() => {
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

function Stat({ label, value, icon }: { label: string; value: number | string; icon?: string }) {
  return (
    <div style={{ flex: 1, textAlign: "center" }}>
      <div style={{ fontSize: "1.6rem", fontWeight: 800 }}>
        {icon} {value}
      </div>
      <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{label}</div>
    </div>
  );
}
