import { useState } from "react";
import { isValidFamilyCode } from "../lib/family";
import { isFirebaseConfigured } from "../lib/firebase";

interface Props {
  onPreviewNewCode: () => string;
  onJoin: (code: string) => string;
}

export function FamilySetupPage({ onPreviewNewCode, onJoin }: Props) {
  const [mode, setMode] = useState<"choose" | "created" | "join">("choose");
  const [newCode, setNewCode] = useState("");
  const [joinInput, setJoinInput] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);

  if (mode === "created") {
    return (
      <div className="screen">
        <h1 className="page-title">家庭空間建立好了！</h1>
        <div className="card" style={{ textAlign: "center" }}>
          <p>把這組代碼記下來，在其他裝置（例如女兒的平板）輸入同一組代碼，資料就會同步。</p>
          <div
            style={{
              fontSize: "2.2rem",
              fontWeight: 800,
              letterSpacing: "0.2em",
              margin: "16px 0",
              color: "var(--color-primary-dark)",
            }}
          >
            {newCode}
          </div>
          <button className="btn btn-primary btn-block" onClick={() => onJoin(newCode)}>
            開始使用
          </button>
        </div>
      </div>
    );
  }

  if (mode === "join") {
    return (
      <div className="screen">
        <h1 className="page-title">設定家庭代碼</h1>
        <div className="card">
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginTop: 0 }}>
            要加入已經在用的空間，就輸入原本的代碼；也可以直接自己取一組好記的代碼（例如
            LINLIN），之後在其他裝置輸入同一組就會同步。
          </p>
          <div className="field">
            <label>家庭代碼</label>
            <input
              value={joinInput}
              onChange={(e) => {
                setJoinInput(e.target.value);
                setJoinError(null);
              }}
              placeholder="例如 LINLIN 或 AB12CD"
              autoCapitalize="characters"
              autoFocus
            />
          </div>
          {joinError && <p style={{ color: "var(--color-danger)" }}>{joinError}</p>}
          <button
            className="btn btn-primary btn-block"
            onClick={() => {
              if (!isValidFamilyCode(joinInput)) {
                setJoinError("代碼請用 4~20 個英文字母或數字（可以有 - 和 _）");
                return;
              }
              onJoin(joinInput);
            }}
          >
            確認
          </button>
          <button
            className="btn btn-outline btn-block"
            style={{ marginTop: 8 }}
            onClick={() => setMode("choose")}
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <h1 className="page-title">歡迎使用漢字複習小幫手</h1>
      <div className="card">
        <p>第一次使用嗎？建立一個專屬於你們家的空間，之後就能在爸媽和女兒的裝置上同步漢字紀錄。</p>
        {!isFirebaseConfigured && (
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
            目前還沒設定雲端資料庫，資料會先存在這台裝置上。之後依照 README
            設定 Firebase，就能跨裝置同步而不遺失現有紀錄。
          </p>
        )}
        <button
          className="btn btn-primary btn-block"
          style={{ marginTop: 12 }}
          onClick={() => {
            setNewCode(onPreviewNewCode());
            setMode("created");
          }}
        >
          幫我隨機產生一組代碼
        </button>
        <button
          className="btn btn-outline btn-block"
          style={{ marginTop: 12 }}
          onClick={() => setMode("join")}
        >
          我要自己輸入代碼
        </button>
      </div>
    </div>
  );
}
