import { Link } from "react-router-dom";
import type { CharacterDoc } from "../types";
import { dateKey } from "../lib/characters";
import { countDueForReview } from "../lib/review";

interface Props {
  characters: CharacterDoc[];
  familyCode: string;
  loading: boolean;
}

export function HomePage({ characters, familyCode, loading }: Props) {
  const totalStars = characters.reduce((sum, c) => sum + c.stats.correctCount, 0);
  const todayKey = dateKey();
  const addedToday = characters.filter((c) => c.addedDateKey === todayKey).length;
  const dueCount = countDueForReview(characters);

  return (
    <div className="screen">
      <h1 className="page-title">哈囉！今天也一起學漢字吧</h1>

      <div className="card" style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <Stat label="已學漢字" value={loading ? "…" : characters.length} />
        <Stat label="累積星星" value={loading ? "…" : totalStars} icon="⭐️" />
        <Stat label="今天新增" value={loading ? "…" : addedToday} />
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <p style={{ margin: "0 0 12px", fontWeight: 600 }}>
          {characters.length === 0
            ? "還沒有任何漢字，先去新增今天共讀繪本學到的字吧！"
            : dueCount > 0
              ? `目前有 ${dueCount} 個字適合複習囉`
              : "今天的字都複習過了，可以自由複習或新增新字"}
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <Link to="/add" className="btn btn-secondary" style={{ flex: 1 }}>
            ✏️ 新增漢字
          </Link>
          <Link to="/review" className="btn btn-primary" style={{ flex: 1 }}>
            🀄 開始複習
          </Link>
        </div>
      </div>

      <p style={{ textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
        家庭代碼：<strong>{familyCode}</strong>
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
