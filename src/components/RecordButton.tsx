import { useEffect, useRef, useState } from "react";

type RecordState = "idle" | "recording" | "recorded" | "unsupported" | "denied";

export function RecordButton() {
  const [state, setState] = useState<RecordState>(
    typeof window !== "undefined" && (window.MediaRecorder === undefined || !navigator.mediaDevices)
      ? "unsupported"
      : "idle",
  );
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
        setState("recorded");
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setState("recording");
    } catch {
      setState("denied");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
  }

  function playRecording() {
    if (audioUrl) new Audio(audioUrl).play().catch(() => {});
  }

  function recordAgain() {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setState("idle");
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
      <button className="btn btn-danger" onClick={stopRecording}>
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
        <button className="btn btn-outline" onClick={recordAgain}>
          🔁 重新錄音
        </button>
      </div>
    );
  }

  return (
    <button className="btn btn-outline" onClick={startRecording}>
      🎤 錄音念念看
    </button>
  );
}
