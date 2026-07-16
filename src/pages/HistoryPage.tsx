import { useState } from "react";
import type { CharacterDoc, SentenceDoc } from "../types";
import { dateKey } from "../lib/characters";
import { DIFFICULTY_LABELS } from "../lib/sentencePractice";

interface Props {
  characters: CharacterDoc[];
  sentences: SentenceDoc[];
}

interface CharDayGroup {
  dateKey: string;
  bookTitles: string[];
  chars: CharacterDoc[];
}

interface SentenceDayGroup {
  dateKey: string;
  sentences: SentenceDoc[];
}

function groupCharsByDate(characters: CharacterDoc[]): CharDayGroup[] {
  const map = new Map<string, CharDayGroup>();
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

function groupSentencesByDate(sentences: SentenceDoc[]): SentenceDayGroup[] {
  const map = new Map<string, SentenceDayGroup>();
  for (const s of sentences) {
    const key = dateKey(new Date(s.createdAt));
    let group = map.get(key);
    if (!group) {
      group = { dateKey: key, sentences: [] };
      map.set(key, group);
    }
    group.sentences.push(s);
  }
  return Array.from(map.values()).sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1));
}

function formatDate(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = ["日", "一", "二", "三", "四", "五", "六"][date.getDay()];
  return `${m}/${d}（週${weekday}）`;
}

export function HistoryPage({ characters, sentences }: Props) {
  const [tab, setTab] = useState<"characters" | "sentences">("characters");

  return (
    <div className="screen">
      <h1 className="page-title">學習紀錄</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button
          className={tab === "characters" ? "btn btn-primary" : "btn btn-outline"}
          style={{ flex: 1 }}
          onClick={() => setTab("characters")}
        >
          漢字紀錄
        </button>
        <button
          className={tab === "sentences" ? "btn btn-primary" : "btn btn-outline"}
          style={{ flex: 1 }}
          onClick={() => setTab("sentences")}
        >
          句子紀錄
        </button>
      </div>

      {tab === "characters" ? (
        <CharacterHistory characters={characters} />
      ) : (
        <SentenceHistory sentences={sentences} />
      )}
    </div>
  );
}

function CharacterHistory({ characters }: { characters: CharacterDoc[] }) {
  const groups = groupCharsByDate(characters);

  if (groups.length === 0) {
    return <div className="empty-state card">還沒有紀錄，新增今天的漢字後就會出現在這裡</div>;
  }

  return (
    <>
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
    </>
  );
}

function SentenceHistory({ sentences }: { sentences: SentenceDoc[] }) {
  const groups = groupSentencesByDate(sentences);

  if (groups.length === 0) {
    return <div className="empty-state card">還沒有句子紀錄，去「造句」頁面讓 AI 生成第一批吧！</div>;
  }

  return (
    <>
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
            <span className="pill">{group.sentences.length} 句</span>
          </div>
          {group.sentences.map((s) => (
            <div
              key={s.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
                padding: "8px 0",
                borderBottom: "1px solid #f1e6d8",
              }}
            >
              <span style={{ fontSize: "1.05rem" }}>{s.text}</span>
              <span style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                {s.sourceChars[0] && (
                  <span className="pill" style={{ fontSize: "0.75rem" }}>
                    衍生自「{s.sourceChars[0]}」
                  </span>
                )}
                <span className="pill" style={{ fontSize: "0.75rem" }}>
                  {DIFFICULTY_LABELS[s.difficulty ?? "medium"]}
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                  {"★".repeat(Math.min(s.stats.box, 5))}
                </span>
              </span>
            </div>
          ))}
        </div>
      ))}
    </>
  );
}
