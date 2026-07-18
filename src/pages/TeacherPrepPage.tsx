import { useState } from "react";
import { Link } from "react-router-dom";
import type { CharacterDoc, PlannedCharacterDoc, SentenceDifficulty, SentenceDoc } from "../types";
import { guessZhuyin, zhuyinCandidates } from "../lib/zhuyin";
import {
  discardStagedCharacterAndSentences,
  movePlannedCharacter,
  releaseStagedCharacterAndSentences,
  removePlannedCharacter,
  saveCharacterBatch,
  savePlannedCharBatch,
  saveSentenceBatch,
} from "../lib/store";
import {
  DIFFICULTY_LABELS,
  generateSentences,
  isSentencePracticeConfigured,
} from "../lib/sentencePractice";
import { SentenceDraftEditor, type DraftEntry } from "../components/SentenceDraftEditor";

const GENERATE_COUNT = 5;
const DIFFICULTY_OPTIONS: SentenceDifficulty[] = ["easy", "medium", "hard"];

interface Pending {
  hanzi: string;
  zhuyin: string;
  candidates: string[];
}

interface Props {
  familyCode: string;
  /** Already-learned characters — used to detect real duplicates and as the
   * AI's "known characters" context (staged characters must NOT count as
   * known, since the child hasn't actually learned them yet). */
  characters: CharacterDoc[];
  stagedCharacters: CharacterDoc[];
  stagedSentences: SentenceDoc[];
  /** The parent's ordered To-Do list of characters to teach on future days,
   * decided before any sentences are written for them — a level "earlier"
   * than staged characters, which already have a prepared sentence batch. */
  plannedChars: PlannedCharacterDoc[];
}

function draftKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface PrepGroup {
  character: CharacterDoc;
  sentences: SentenceDoc[];
}

function groupStagedByCharacter(stagedCharacters: CharacterDoc[], stagedSentences: SentenceDoc[]): PrepGroup[] {
  return [...stagedCharacters]
    .sort((a, b) => b.addedAt - a.addedAt)
    .map((character) => ({
      character,
      sentences: stagedSentences.filter((s) => s.sourceChars[0] === character.hanzi),
    }));
}

export function TeacherPrepPage({
  familyCode,
  characters,
  stagedCharacters,
  stagedSentences,
  plannedChars,
}: Props) {
  const [rawInput, setRawInput] = useState("");
  const [pending, setPending] = useState<Pending | null>(null);
  const [saving, setSaving] = useState(false);
  const [inputMsg, setInputMsg] = useState<string | null>(null);
  const [savedWord, setSavedWord] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [difficulty, setDifficulty] = useState<SentenceDifficulty>("medium");
  const [drafts, setDrafts] = useState<DraftEntry[] | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [savingDrafts, setSavingDrafts] = useState(false);
  const [busyCharId, setBusyCharId] = useState<string | null>(null);
  const [planInput, setPlanInput] = useState("");
  const [planSaving, setPlanSaving] = useState(false);
  const [planMsg, setPlanMsg] = useState<string | null>(null);
  const [busyPlanId, setBusyPlanId] = useState<string | null>(null);

  function resetInputFlow() {
    setPending(null);
    setSavedWord(null);
    setJustSaved(false);
    setDrafts(null);
    setGenError(null);
    setInputMsg(null);
  }

  function handleAddFromInput(overrideText?: string) {
    const trimmed = (overrideText ?? rawInput).trim();
    const chars = Array.from(trimmed);
    if (chars.length === 0 || !chars.some((c) => /\p{Script=Han}/u.test(c))) return;

    if (characters.some((c) => c.hanzi === trimmed)) {
      setInputMsg(`「${trimmed}」已經學過囉，不需要準備。`);
      setRawInput("");
      return;
    }

    const existingStaged = stagedCharacters.find((c) => c.hanzi === trimmed);
    if (existingStaged) {
      resetInputFlow();
      setSavedWord(trimmed);
      setDifficulty("medium");
      setRawInput("");
      return;
    }

    setInputMsg(null);
    const candidates = chars.length === 1 ? zhuyinCandidates(trimmed) : [guessZhuyin(trimmed)];
    setPending({ hanzi: trimmed, zhuyin: candidates[0], candidates });
    setRawInput("");
  }

  /** Tapping a planned character jumps straight into the prep flow for it
   * (as if the parent had just typed it into the input above), then drops it
   * from the To-Do list — it has now moved from "planned" to "being
   * prepared". */
  function startPreparingPlanned(item: PlannedCharacterDoc) {
    handleAddFromInput(item.hanzi);
    removePlannedCharacter(familyCode, item.id);
  }

  async function handleAddPlanned() {
    const pastedChars = Array.from(planInput).filter((c) => /\p{Script=Han}/u.test(c));
    const uniqueChars = [...new Set(pastedChars)];
    const alreadyElsewhere = new Set([
      ...characters.map((c) => c.hanzi),
      ...stagedCharacters.map((c) => c.hanzi),
      ...plannedChars.map((p) => p.hanzi),
    ]);
    const newChars = uniqueChars.filter((c) => !alreadyElsewhere.has(c));

    if (uniqueChars.length === 0) {
      setPlanMsg("沒有偵測到漢字，請確認輸入的內容。");
      return;
    }
    if (newChars.length === 0) {
      setPlanMsg("這些字都已經學過、準備中，或已經在清單裡了，沒有新增任何字。");
      return;
    }

    setPlanSaving(true);
    try {
      await savePlannedCharBatch(familyCode, newChars);
      const skipped = uniqueChars.length - newChars.length;
      setPlanMsg(`已加入 ${newChars.length} 個字到清單${skipped > 0 ? `，略過 ${skipped} 個重複的字` : ""}。`);
      setPlanInput("");
    } finally {
      setPlanSaving(false);
    }
  }

  async function handleRemovePlanned(id: string) {
    setBusyPlanId(id);
    try {
      await removePlannedCharacter(familyCode, id);
    } finally {
      setBusyPlanId(null);
    }
  }

  async function handleMovePlanned(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= plannedChars.length) return;
    const a = plannedChars[index];
    const b = plannedChars[target];
    setBusyPlanId(a.id);
    try {
      await movePlannedCharacter(familyCode, a, b);
    } finally {
      setBusyPlanId(null);
    }
  }

  function updatePendingZhuyin(zhuyin: string) {
    setPending((p) => (p ? { ...p, zhuyin } : p));
  }

  async function handleSaveWord() {
    if (!pending) return;
    setSaving(true);
    try {
      await saveCharacterBatch(familyCode, [{ hanzi: pending.hanzi, zhuyin: pending.zhuyin }], true);
      setSavedWord(pending.hanzi);
      setPending(null);
      setDifficulty("medium");
      setDrafts(null);
      setGenError(null);
      setJustSaved(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerate() {
    if (!savedWord) return;
    setGenerating(true);
    setGenError(null);
    try {
      const knownCharsList = [
        ...new Set([...characters.flatMap((c) => Array.from(c.hanzi)), ...Array.from(savedWord)]),
      ];
      const referenceSentences = stagedSentences
        .filter((s) => s.sourceChars[0] === savedWord && (s.origin === "user" || s.origin === "edited"))
        .map((s) => s.text)
        .slice(0, 5);
      const newTexts = await generateSentences(
        knownCharsList,
        savedWord,
        difficulty,
        GENERATE_COUNT,
        [],
        referenceSentences,
      );
      if (newTexts.length === 0) {
        setGenError(`這次沒有生成出用到「${savedWord}」的合適句子，可以再試一次，或是自己寫句子！`);
        return;
      }
      const aiDrafts: DraftEntry[] = newTexts.map((text) => ({ key: draftKey(), text, origin: "ai" }));
      setDrafts((prev) => {
        const kept = (prev ?? []).filter((d) => d.origin !== "ai");
        return [...kept, ...aiDrafts];
      });
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "發生錯誤，請稍後再試一次");
    } finally {
      setGenerating(false);
    }
  }

  function handleWriteOwn() {
    setGenError(null);
    setDrafts((prev) => prev ?? []);
  }

  function handleUpdateDraftText(key: string, text: string) {
    setDrafts((prev) =>
      prev
        ? prev.map((d) => (d.key === key ? { ...d, text, origin: d.origin === "ai" ? "edited" : d.origin } : d))
        : prev,
    );
  }

  function handleRemoveDraft(key: string) {
    setDrafts((prev) => (prev ? prev.filter((d) => d.key !== key) : prev));
  }

  function handleAddDraft(text: string) {
    setDrafts((prev) => [...(prev ?? []), { key: draftKey(), text, origin: "user" }]);
  }

  async function handleConfirmDrafts() {
    if (!savedWord || !drafts || drafts.length === 0) return;
    setSavingDrafts(true);
    try {
      await saveSentenceBatch(
        familyCode,
        drafts.map((d) => ({ text: d.text, origin: d.origin })),
        [savedWord],
        difficulty,
        true,
      );
      setDrafts(null);
      setJustSaved(true);
    } finally {
      setSavingDrafts(false);
    }
  }

  async function handleRelease(group: PrepGroup) {
    setBusyCharId(group.character.id);
    try {
      await releaseStagedCharacterAndSentences(
        familyCode,
        group.character.id,
        group.sentences.map((s) => s.id),
      );
    } finally {
      setBusyCharId(null);
    }
  }

  async function handleDiscard(group: PrepGroup) {
    if (
      !confirm(
        `確定要刪除準備好的「${group.character.hanzi}」跟它的 ${group.sentences.length} 句話嗎？這個動作不能復原。`,
      )
    ) {
      return;
    }
    setBusyCharId(group.character.id);
    try {
      await discardStagedCharacterAndSentences(
        familyCode,
        group.character.id,
        group.sentences.map((s) => s.id),
      );
    } finally {
      setBusyCharId(null);
    }
  }

  const groups = groupStagedByCharacter(stagedCharacters, stagedSentences);

  return (
    <div className="screen">
      <h1 className="page-title">👩‍🏫 老師準備區</h1>
      <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginTop: -8, marginBottom: 16 }}>
        在這裡先準備好之後幾天要教的生字跟句子，小朋友不會看到、也不會被 AI
        當成「已經學過」，等你按下「今天開始教這個字」才會正式加入她的學習紀錄。
      </p>

      <div className="card" style={{ marginBottom: 16 }}>
        <p style={{ fontWeight: 700, margin: "0 0 4px" }}>📅 待學習字清單（{plannedChars.length} 個字）</p>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", margin: "0 0 12px" }}>
          先把接下來預計要教的字照順序列出來，一目瞭然明天、後天要用什麼字造句；點字可以直接開始準備它的句子
          （會自動從這個清單移除）。
        </p>

        {plannedChars.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            {plannedChars.map((item, i) => {
              const busy = busyPlanId === item.id;
              return (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 0",
                    borderBottom: i < plannedChars.length - 1 ? "1px solid #f0e6d6" : "none",
                  }}
                >
                  <span style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", minWidth: 20 }}>
                    {i + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => startPreparingPlanned(item)}
                    disabled={busy}
                    style={{
                      flex: 1,
                      textAlign: "left",
                      fontSize: "1.3rem",
                      fontWeight: 700,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "inherit",
                      padding: "4px 0",
                    }}
                  >
                    {item.hanzi}
                  </button>
                  <button
                    type="button"
                    aria-label="往前移"
                    disabled={busy || i === 0}
                    onClick={() => handleMovePlanned(i, -1)}
                    style={{ background: "none", border: "none", fontSize: "1.1rem", cursor: "pointer", padding: 4 }}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    aria-label="往後移"
                    disabled={busy || i === plannedChars.length - 1}
                    onClick={() => handleMovePlanned(i, 1)}
                    style={{ background: "none", border: "none", fontSize: "1.1rem", cursor: "pointer", padding: 4 }}
                  >
                    ▼
                  </button>
                  <button
                    type="button"
                    aria-label={`從清單移除「${item.hanzi}」`}
                    disabled={busy}
                    onClick={() => handleRemovePlanned(item.id)}
                    style={{ background: "none", border: "none", fontSize: "1.1rem", cursor: "pointer", padding: 4 }}
                  >
                    🗑
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="field" style={{ marginBottom: 8 }}>
          <label>批次加入字（貼一串字，會自動拆成一個一個）</label>
          <input
            value={planInput}
            onChange={(e) => {
              setPlanInput(e.target.value);
              setPlanMsg(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddPlanned();
            }}
            placeholder="例如：安愛天水好學"
          />
        </div>
        <button className="btn btn-outline btn-block" disabled={planSaving} onClick={handleAddPlanned}>
          {planSaving ? "加入中…" : "加入清單"}
        </button>
        {planMsg && (
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", margin: "10px 0 0" }}>{planMsg}</p>
        )}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="field" style={{ marginBottom: 8 }}>
          <label>輸入要準備的漢字或詞彙</label>
          <input
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddFromInput();
            }}
            placeholder="例如：學 或 毛毛蟲"
          />
        </div>
        <button className="btn btn-secondary btn-block" onClick={() => handleAddFromInput()}>
          加入
        </button>
        {inputMsg && (
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", margin: "10px 0 0" }}>{inputMsg}</p>
        )}
      </div>

      {pending && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ fontSize: "2rem", minWidth: 48, textAlign: "center" }}>{pending.hanzi}</div>
            <div style={{ flex: 1 }}>
              {pending.candidates.length > 1 ? (
                <select
                  value={pending.zhuyin}
                  onChange={(e) => updatePendingZhuyin(e.target.value)}
                  style={{ width: "100%", padding: 10, borderRadius: 12, fontSize: "1rem" }}
                >
                  {pending.candidates.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              ) : (
                <input value={pending.zhuyin} onChange={(e) => updatePendingZhuyin(e.target.value)} style={{ fontSize: "1rem" }} />
              )}
            </div>
            <button
              onClick={() => setPending(null)}
              aria-label="取消"
              style={{ background: "none", border: "none", fontSize: "1.3rem", color: "var(--color-text-muted)", cursor: "pointer" }}
            >
              ✕
            </button>
          </div>
          <button className="btn btn-primary btn-block" disabled={saving} onClick={handleSaveWord}>
            {saving ? "儲存中…" : "儲存"}
          </button>
        </div>
      )}

      {savedWord && (
        <div className="card" style={{ marginBottom: 16 }}>
          <p style={{ margin: "0 0 12px", fontWeight: 700 }}>📝 準備「{savedWord}」的句子</p>

          {justSaved ? (
            <>
              <p style={{ color: "var(--color-success)", fontWeight: 700, margin: "0 0 12px" }}>
                ✅ 已經準備好「{savedWord}」的{DIFFICULTY_LABELS[difficulty]}句子了！
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                  onClick={() => {
                    setJustSaved(false);
                    setDrafts(null);
                  }}
                >
                  ➕ 再準備別的難度
                </button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={resetInputFlow}>
                  準備下一個字
                </button>
              </div>
            </>
          ) : drafts !== null ? (
            <SentenceDraftEditor
              drafts={drafts}
              onUpdateText={handleUpdateDraftText}
              onRemove={handleRemoveDraft}
              onAdd={handleAddDraft}
              onConfirm={handleConfirmDrafts}
              onRegenerate={isSentencePracticeConfigured ? handleGenerate : undefined}
              regenerating={generating}
              saving={savingDrafts}
              confirmLabel={(n) => `✅ 存進老師準備區（${n} 句）`}
            />
          ) : (
            <>
              <div className="field">
                <label>難度</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {DIFFICULTY_OPTIONS.map((d) => (
                    <button
                      key={d}
                      className={d === difficulty ? "btn btn-primary" : "btn btn-outline"}
                      style={{ flex: 1 }}
                      onClick={() => setDifficulty(d)}
                    >
                      {DIFFICULTY_LABELS[d]}
                    </button>
                  ))}
                </div>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.8rem", marginBottom: 0 }}>
                  難度越高，句子越長、念對了星星也越多。
                </p>
              </div>

              {genError && <p style={{ color: "var(--color-danger)", fontSize: "0.9rem" }}>{genError}</p>}

              <div style={{ display: "flex", gap: 10 }}>
                {isSentencePracticeConfigured && (
                  <button className="btn btn-primary" style={{ flex: 1 }} disabled={generating} onClick={handleGenerate}>
                    {generating ? "AI 出題中…" : "🪄 產生 5 句練習句子"}
                  </button>
                )}
                <button className="btn btn-outline" style={{ flex: 1 }} onClick={handleWriteOwn}>
                  ✍️ 自己寫句子
                </button>
              </div>
              {!isSentencePracticeConfigured && (
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", marginTop: 10 }}>
                  AI 造句還沒設定好（見 README），但還是可以自己寫句子來準備。
                </p>
              )}
            </>
          )}

          <button
            onClick={resetInputFlow}
            style={{
              background: "none",
              border: "none",
              display: "block",
              margin: "12px auto 0",
              fontSize: "0.85rem",
              color: "var(--color-text-muted)",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            略過，準備下一個字
          </button>
        </div>
      )}

      <p style={{ fontWeight: 700, margin: "20px 0 10px" }}>📦 已準備好的內容（{groups.length} 個字）</p>

      {groups.length === 0 ? (
        <div className="empty-state card">還沒有準備任何內容，在上面新增一個字開始準備吧！</div>
      ) : (
        groups.map((group) => {
          const busy = busyCharId === group.character.id;
          return (
            <div className="card" key={group.character.id} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                <span style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <strong style={{ fontSize: "1.3rem" }}>{group.character.hanzi}</strong>
                  <span style={{ color: "var(--color-secondary)", fontSize: "0.85rem" }}>{group.character.zhuyin}</span>
                </span>
                <span className="pill">{group.sentences.length} 句</span>
              </div>

              {group.sentences.length === 0 ? (
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", margin: "0 0 12px" }}>
                  還沒有準備句子——上面輸入「{group.character.hanzi}」可以繼續幫它加句子。
                </p>
              ) : (
                DIFFICULTY_OPTIONS.map((d) => {
                  const forDifficulty = group.sentences.filter((s) => (s.difficulty ?? "medium") === d);
                  if (forDifficulty.length === 0) return null;
                  return (
                    <div key={d} style={{ marginBottom: 8 }}>
                      <span className="pill" style={{ fontSize: "0.7rem", marginBottom: 4, display: "inline-block" }}>
                        {DIFFICULTY_LABELS[d]}
                      </span>
                      {forDifficulty.map((s) => (
                        <p key={s.id} style={{ margin: "4px 0", fontSize: "1rem" }}>
                          {s.text}
                        </p>
                      ))}
                    </div>
                  );
                })
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <button className="btn btn-outline" style={{ flex: 1 }} disabled={busy} onClick={() => handleDiscard(group)}>
                  🗑 刪除整批
                </button>
                <button className="btn btn-primary" style={{ flex: 1 }} disabled={busy} onClick={() => handleRelease(group)}>
                  {busy ? "處理中…" : "🚀 今天開始教這個字"}
                </button>
              </div>
            </div>
          );
        })
      )}

      <Link to="/history" className="btn btn-outline btn-block" style={{ marginTop: 4 }}>
        回學習紀錄
      </Link>
    </div>
  );
}
