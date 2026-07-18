import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { CharacterDoc, SentenceDoc, WeakCharDoc } from "../types";
import { dateKey } from "../lib/characters";
import { masteryLabel } from "../lib/review";
import { DIFFICULTY_LABELS } from "../lib/sentencePractice";
import { removeCharacter, removeWeakCharEntry, saveWeakChar, usingCloudSync } from "../lib/store";
import { backupLocalDataToCloud, peekLocalBackupSummary, type LocalBackupSummary } from "../lib/backup";

interface Props {
  characters: CharacterDoc[];
  sentences: SentenceDoc[];
  weakChars: WeakCharDoc[];
  familyCode: string;
}

interface CharDayGroup {
  dateKey: string;
  bookTitles: string[];
  chars: CharacterDoc[];
}

interface SentenceBatch {
  key: string;
  createdAt: number;
  sourceChars: string[];
  sentences: SentenceDoc[];
}

interface SentenceDayGroup {
  dateKey: string;
  batches: SentenceBatch[];
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
  const batchMap = new Map<string, SentenceBatch>();
  for (const s of sentences) {
    const batchKey = `${s.createdAt}|${s.sourceChars.join(",")}`;
    let batch = batchMap.get(batchKey);
    if (!batch) {
      batch = { key: batchKey, createdAt: s.createdAt, sourceChars: s.sourceChars, sentences: [] };
      batchMap.set(batchKey, batch);
    }
    batch.sentences.push(s);
  }

  const dayMap = new Map<string, SentenceDayGroup>();
  for (const batch of batchMap.values()) {
    const key = dateKey(new Date(batch.createdAt));
    let group = dayMap.get(key);
    if (!group) {
      group = { dateKey: key, batches: [] };
      dayMap.set(key, group);
    }
    group.batches.push(batch);
  }
  for (const group of dayMap.values()) {
    group.batches.sort((a, b) => b.createdAt - a.createdAt);
  }
  return Array.from(dayMap.values()).sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1));
}

function formatDate(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = ["日", "一", "二", "三", "四", "五", "六"][date.getDay()];
  return `${m}/${d}（週${weekday}）`;
}

export function HistoryPage({ characters, sentences, weakChars, familyCode }: Props) {
  const [tab, setTab] = useState<"characters" | "sentences">("characters");
  const [query, setQuery] = useState("");
  const weakCharSet = new Set(weakChars.map((w) => w.hanzi));
  const trimmedQuery = query.trim();
  const filteredCharacters = trimmedQuery
    ? characters.filter((c) => c.hanzi.includes(trimmedQuery))
    : characters;

  return (
    <div className="screen">
      <h1 className="page-title">學習紀錄</h1>

      <SyncStatusSection familyCode={familyCode} />

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
        <>
          <ExportCharactersSection characters={characters} />
          <CharacterLookup characters={characters} weakChars={weakCharSet} query={query} onQueryChange={setQuery} />
          <WeakCharsSection weakChars={weakChars} familyCode={familyCode} />
          {(!trimmedQuery || filteredCharacters.length > 0) && (
            <CharacterHistory characters={filteredCharacters} familyCode={familyCode} />
          )}
        </>
      ) : (
        <SentenceHistory sentences={sentences} />
      )}
    </div>
  );
}

function SyncStatusSection({ familyCode }: { familyCode: string }) {
  const [summary] = useState(() => peekLocalBackupSummary(familyCode));
  const [state, setState] = useState<"idle" | "working" | "done" | "error">("idle");
  const [result, setResult] = useState<LocalBackupSummary | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  if (!usingCloudSync) {
    return (
      <div className="card" style={{ marginBottom: 16 }}>
        <p style={{ fontWeight: 700, margin: "0 0 4px" }}>📴 目前是本機模式</p>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", margin: 0 }}>
          資料只存在這台裝置的瀏覽器裡，換手機、清瀏覽器資料都會遺失。想要雲端備份、多裝置同步，需要先設定
          Firebase（見 README「設定 Firebase 雲端同步」章節）。
        </p>
      </div>
    );
  }

  const hasLocal =
    summary.characters +
      summary.sentences +
      summary.weakChars +
      summary.prizes +
      summary.affection +
      summary.plannedChars >
    0;

  if (!hasLocal && state !== "done") {
    return (
      <div className="card" style={{ marginBottom: 16 }}>
        <p style={{ fontWeight: 700, margin: 0 }}>☁️ 雲端同步中，資料已經備份好了</p>
      </div>
    );
  }

  async function handleBackup() {
    setState("working");
    setErrorMsg("");
    try {
      const r = await backupLocalDataToCloud(familyCode);
      setResult(r);
      setState("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "備份失敗，請稍後再試一次");
      setState("error");
    }
  }

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <p style={{ fontWeight: 700, margin: "0 0 4px" }}>☁️ 雲端同步中</p>
      {state === "done" && result ? (
        <p style={{ color: "var(--color-success)", fontSize: "0.85rem", margin: 0 }}>
          ✅ 已經把這台裝置上的舊資料備份到雲端：{result.characters} 個字、{result.sentences} 句、
          {result.prizes} 隻怪獸、{result.affection} 筆好感度。
        </p>
      ) : (
        <>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", margin: "0 0 10px" }}>
            這台裝置上還留著 {summary.characters} 個字、{summary.sentences} 句、{summary.prizes}{" "}
            隻怪獸尚未同步到雲端，可能是設定雲端同步之前留下的舊資料。備份後本機資料還會保留，不會被刪掉。
          </p>
          <button className="btn btn-primary" onClick={handleBackup} disabled={state === "working"}>
            {state === "working" ? "備份中…" : "立即備份到雲端"}
          </button>
          {state === "error" && (
            <p style={{ color: "var(--color-danger)", fontSize: "0.85rem", margin: "8px 0 0" }}>
              ⚠️ {errorMsg}
            </p>
          )}
        </>
      )}
    </div>
  );
}

function exportedHanziString(characters: CharacterDoc[]): string {
  const sorted = [...characters].sort((a, b) => a.addedAt - b.addedAt);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of sorted) {
    for (const ch of c.hanzi) {
      if (/\p{Script=Han}/u.test(ch) && !seen.has(ch)) {
        seen.add(ch);
        out.push(ch);
      }
    }
  }
  return out.join("");
}

function ExportCharactersSection({ characters }: { characters: CharacterDoc[] }) {
  const [exported, setExported] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (characters.length === 0) return null;

  async function handleExport() {
    const text = exportedHanziString(characters);
    setExported(text);
    setCopied(false);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // Clipboard API unavailable or denied — the textarea below still lets
      // the user select-all and copy manually.
    }
  }

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <p style={{ fontWeight: 700, margin: 0 }}>📤 匯出已學漢字</p>
        <button className="btn btn-outline" onClick={handleExport}>
          匯出
        </button>
      </div>
      {exported !== null && (
        <>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", margin: "8px 0 6px" }}>
            共 {Array.from(exported).length} 字，{copied ? "已複製到剪貼簿" : "自動複製失敗，可以在下面手動全選複製"}
          </p>
          <textarea
            readOnly
            value={exported}
            rows={4}
            onFocus={(e) => e.currentTarget.select()}
            style={{
              width: "100%",
              fontSize: "1rem",
              padding: 10,
              borderRadius: 12,
              border: "2px solid #eee0d0",
              boxSizing: "border-box",
            }}
          />
        </>
      )}
    </div>
  );
}

function CharacterLookup({
  characters,
  weakChars,
  query,
  onQueryChange,
}: {
  characters: CharacterDoc[];
  weakChars: Set<string>;
  query: string;
  onQueryChange: (value: string) => void;
}) {
  const trimmed = query.trim();
  const exact = trimmed ? characters.find((c) => c.hanzi === trimmed) : undefined;
  const partial = trimmed
    ? characters.filter((c) => c.hanzi !== trimmed && c.hanzi.includes(trimmed))
    : [];

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <p style={{ fontWeight: 700, margin: "0 0 10px" }}>🔍 查詢是否學過</p>
      <input
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="輸入一個字或詞看看有沒有學過"
      />
      {trimmed && (
        <div style={{ marginTop: 12 }}>
          {exact ? (
            <p style={{ color: "var(--color-success)", fontWeight: 700, margin: 0 }}>
              ✅ 已經學過「{trimmed}」
              <span
                style={{
                  display: "block",
                  fontWeight: 400,
                  color: "var(--color-text-muted)",
                  fontSize: "0.85rem",
                  marginTop: 4,
                }}
              >
                {formatDate(exact.addedDateKey)} 新增，注音 {exact.zhuyin}
                {weakChars.has(trimmed) ? "，目前標記為需要加強練習" : ""}
              </span>
            </p>
          ) : (
            <p style={{ color: "var(--color-danger)", fontWeight: 700, margin: 0 }}>
              ❌ 還沒學過「{trimmed}」
            </p>
          )}
          {partial.length > 0 && (
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", marginTop: 8, marginBottom: 0 }}>
              包含「{trimmed}」的詞：{partial.map((p) => p.hanzi).join("、")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function WeakCharsSection({ weakChars, familyCode }: { weakChars: WeakCharDoc[]; familyCode: string }) {
  const navigate = useNavigate();
  const [input, setInput] = useState("");

  function handleAdd() {
    const trimmed = input.trim();
    const chars = Array.from(trimmed);
    if (chars.length !== 1 || !/\p{Script=Han}/u.test(chars[0])) return;
    saveWeakChar(familyCode, chars[0]);
    setInput("");
  }

  function practiceChar(hanzi: string) {
    navigate("/sentences", { state: { prefillChar: hanzi } });
  }

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <p style={{ fontWeight: 700, margin: "0 0 6px" }}>🧩 需要加強練習的字</p>
      <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", marginTop: 0 }}>
        練習句子時點一下不會念的字會自動加進來，也可以在這裡手動加入或刪除。AI 之後造句會盡量把這些字帶進去。
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
          placeholder="輸入一個字"
          style={{ flex: 1 }}
        />
        <button className="btn btn-secondary" onClick={handleAdd}>
          加入
        </button>
      </div>

      {weakChars.length === 0 ? (
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", margin: 0 }}>
          還沒有標記不熟的字。
        </p>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {weakChars.map((w) => (
            <div
              key={w.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                background: "#fff8ee",
                borderRadius: 10,
                padding: "4px 4px 4px 12px",
              }}
            >
              <span style={{ fontSize: "1.2rem" }}>{w.hanzi}</span>
              <button
                onClick={() => practiceChar(w.hanzi)}
                aria-label="用這個字造句"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "1rem",
                  padding: "4px 6px",
                }}
              >
                🪄
              </button>
              <button
                onClick={() => removeWeakCharEntry(familyCode, w.id)}
                aria-label="移除"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-text-muted)",
                  fontSize: "1rem",
                  padding: "4px 6px",
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CharacterHistory({ characters, familyCode }: { characters: CharacterDoc[]; familyCode: string }) {
  const groups = groupCharsByDate(characters);

  if (groups.length === 0) {
    return <div className="empty-state card">還沒有紀錄，新增今天的漢字後就會出現在這裡</div>;
  }

  async function handleDelete(c: CharacterDoc) {
    if (!confirm(`確定要刪除「${c.hanzi.length > 10 ? c.hanzi.slice(0, 10) + "…" : c.hanzi}」嗎？`)) return;
    await removeCharacter(familyCode, c.id);
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
            {group.chars.map((c) => {
              const isLong = Array.from(c.hanzi).length > 10;
              const displayHanzi = isLong ? Array.from(c.hanzi).slice(0, 10).join("") + "…" : c.hanzi;
              return (
                <div
                  key={c.id}
                  title={isLong ? c.hanzi : undefined}
                  style={{
                    position: "relative",
                    textAlign: "center",
                    background: "#fff8ee",
                    borderRadius: 12,
                    padding: "8px 12px",
                    paddingTop: 18,
                    minWidth: 56,
                    maxWidth: isLong ? 220 : undefined,
                  }}
                >
                  <button
                    onClick={() => handleDelete(c)}
                    aria-label={`刪除「${displayHanzi}」`}
                    style={{
                      position: "absolute",
                      top: 0,
                      right: 2,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--color-text-muted)",
                      fontSize: "0.75rem",
                      padding: 4,
                      lineHeight: 1,
                    }}
                  >
                    ✕
                  </button>
                  <div style={{ fontSize: isLong ? "1.1rem" : "1.6rem", wordBreak: "break-all" }}>
                    {displayHanzi}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "var(--color-secondary)" }}>{c.zhuyin}</div>
                  <div style={{ fontSize: "0.65rem", color: "var(--color-text-muted)" }}>
                    {masteryLabel(c.stats.box)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}

function SentenceHistory({ sentences }: { sentences: SentenceDoc[] }) {
  const navigate = useNavigate();
  const groups = groupSentencesByDate(sentences);

  function practiceBatch(batch: SentenceBatch) {
    navigate("/sentences/batch", { state: { ids: batch.sentences.map((s) => s.id) } });
  }

  return (
    <>
      <Link to="/sentences/manage" className="btn btn-primary btn-block" style={{ marginBottom: 10 }}>
        📋 管理句子庫（修改／刪除）
      </Link>
      <Link to="/sentences/bulk-import" className="btn btn-outline btn-block" style={{ marginBottom: 10 }}>
        📥 批次匯入句子
      </Link>
      <Link to="/teacher-prep" className="btn btn-outline btn-block" style={{ marginBottom: 16 }}>
        👩‍🏫 老師準備區
      </Link>

      {groups.length === 0 && (
        <div className="empty-state card">還沒有句子紀錄，去「新增」加一個字讓 AI 生成第一批吧！</div>
      )}

      {groups.map((group) => {
        const totalSentences = group.batches.reduce((sum, b) => sum + b.sentences.length, 0);
        return (
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
              <span className="pill">{totalSentences} 句</span>
            </div>
            {group.batches.map((batch) => (
              <div
                key={batch.key}
                style={{
                  padding: "10px 0",
                  borderBottom: "1px solid #f1e6d8",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <span style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                    {batch.sourceChars[0] && (
                      <span className="pill" style={{ fontSize: "0.75rem" }}>
                        衍生自「{batch.sourceChars[0]}」
                      </span>
                    )}
                    <span className="pill" style={{ fontSize: "0.75rem" }}>
                      {DIFFICULTY_LABELS[batch.sentences[0]?.difficulty ?? "medium"]}
                    </span>
                  </span>
                  <button
                    className="btn btn-outline"
                    style={{ fontSize: "0.8rem", padding: "6px 12px" }}
                    onClick={() => practiceBatch(batch)}
                  >
                    🔁 練習這批
                  </button>
                </div>
                {batch.sentences.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 10,
                      padding: "4px 0",
                    }}
                  >
                    <span style={{ fontSize: "1.05rem" }}>{s.text}</span>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", flexShrink: 0 }}>
                      {masteryLabel(s.stats.box)}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
}
