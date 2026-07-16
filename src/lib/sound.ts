let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioContextClass =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioCtx) audioCtx = new AudioContextClass();
  if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
  return audioCtx;
}

/** A short ascending chime, synthesized so no audio asset needs to be shipped. */
export function playStarSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  const startTime = ctx.currentTime;

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;

    const noteStart = startTime + i * 0.08;
    const noteEnd = noteStart + 0.25;
    gain.gain.setValueAtTime(0, noteStart);
    gain.gain.linearRampToValueAtTime(0.25, noteStart + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, noteEnd);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(noteStart);
    osc.stop(noteEnd);
  });
}
