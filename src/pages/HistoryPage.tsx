import type { CharacterDoc } from "../types";

interface Props {
  characters: CharacterDoc[];
}

interface DayGroup {
  dateKey: string;
  bookTitles: string[];
  chars: CharacterDoc[];
}

function groupByDate(characters: CharacterDoc[]): DayGroup[] {
  const map = new Map<string, DayGroup>();
  for (const c of characters) {
    let group = map.get(c.addedDateKey);
    if (!group) {
      group = { dateKey: c.addedDateKey, bookTitles: [], chars: [] };
      map.set(c.addedDateKey, group);
    }
    group.chars.push(c);
    if (c.bookTitle && !group.bookTitles.includes(c.bookTitle)) {
      group.bookTitles.push(c.bookTitle);
    }
  }
  return Array.from(map.values()).sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1));
}

function formatDate(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = ["日", "一", "二", "三", "四", "五", "六"][date.getDay()];
  return `${m}/${d}（週${weekday}）`;
}

export function HistoryPage({ characters }: Props) {
  const groups = groupByDate(characters);

  return (
    <div className="screen">
      <h1 className="page-title">學習紀錄</h1>

      {groups.length === 0 && (
        <div className="empty-state card">還沒有紀錄，新增今天的漢字後就會出現在這裡</div>
      )}

      {groups.map((group) => (
        <div className="card" key={group.dateKey} style={{ marginBottom: 14 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 10,
            }}
          >
            <strong>{formatDate(group.dateKey)}</strong>
            <span className="pill">{group.chars.length} 個字</span>
          </div>
          {group.bookTitles.length > 0 && (
            <p style={{ margin: "0 0 10px", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
              📖 {group.bookTitles.join("、")}
            </p>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {group.chars.map((c) => (
              <div
                key={c.id}
                style={{
                  textAlign: "center",
                  background: "#fff8ee",
                  borderRadius: 12,
                  padding: "8px 12px",
                  minWidth: 56,
                }}
              >
                <div style={{ fontSize: "1.6rem" }}>{c.hanzi}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--color-secondary)" }}>{c.zhuyin}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>
                  {"★".repeat(Math.min(c.stats.box, 5))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
