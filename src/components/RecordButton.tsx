import { useEffect } from "react";
import { useAudioRecorder } from "../hooks/useAudioRecorder";

interface Props {
  /** Fired once each time a recording finishes, with a playable object URL
   * for the clip (revoked automatically on unmount/re-record). */
  onRecorded?: (audioUrl: string) => void;
  /** Fired whenever it becomes clear recording isn't actually usable here
   * (unsupported browser, or the mic permission was denied), so callers
   * that gate on "must record first" can fall back gracefully instead of
   * permanently blocking a family with no working microphone. */
  onUnavailable?: () => void;
  /** Text for the initial "start recording" button. Defaults to the
   * "read the sentence" framing; games override it (e.g. "🎤 教我這個字"). */
  label?: string;
}

export function RecordButton({ onRecorded, onUnavailable, label = "🎤 錄音念念看" }: Props) {
  const { state, audioUrl, start, stop, reset } = useAudioRecorder(onUnavailable);

  useEffect(() => {
    if (state === "recorded" && audioUrl) onRecorded?.(audioUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, audioUrl]);

  async function startRecording() {
    await start();
  }

  function handleStop() {
    stop();
  }

  function playRecording() {
    if (audioUrl) new Audio(audioUrl).play().catch(() => {});
  }

  if (state === "unsupported") return null;

  if (state === "denied") {
    return (
      <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
        無法使用麥克風，請檢查瀏覽器的錄音權限設定
      </p>
    );
  }

  if (state === "recording") {
    return (
      <button className="btn btn-danger" onClick={handleStop}>
        ⏹ 停止錄音
      </button>
    );
  }

  if (state === "recorded") {
    return (
      <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
        <button className="btn btn-secondary" onClick={playRecording}>
          ▶️ 播放我的錄音
        </button>
        <button className="btn btn-outline" onClick={reset}>
          🔁 重新錄音
        </button>
      </div>
    );
  }

  return (
    <button className="btn btn-outline" onClick={startRecording}>
      {label}
    </button>
  );
}
