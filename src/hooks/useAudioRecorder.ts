import { useEffect, useRef, useState } from "react";

export type RecorderState = "idle" | "recording" | "recorded" | "unsupported" | "denied";

export interface UseAudioRecorder {
  state: RecorderState;
  audioUrl: string | null;
  start: () => Promise<void>;
  stop: () => void;
  /** Clears the current recording and goes back to "idle" so a new one can
   * be started (e.g. "🔁 重新錄音"). */
  reset: () => void;
}

/** Shared microphone-recording logic behind press-and-hold recording
 * interactions (e.g. holding a character in the "教小動物" game), providing
 * start/stop/blob-url behavior without any UI chrome of its own. */
export function useAudioRecorder(onUnavailable?: () => void): UseAudioRecorder {
  const [state, setState] = useState<RecorderState>(
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

  useEffect(() => {
    if (state === "unsupported" || state === "denied") onUnavailable?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  async function start() {
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
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
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

  function stop() {
    mediaRecorderRef.current?.stop();
  }

  function reset() {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setState("idle");
  }

  return { state, audioUrl, start, stop, reset };
}
