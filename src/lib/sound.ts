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

/** A short descending two-tone blip for spending stars on a gift — the
 * mirror image of playStarSound()'s ascending chime, so "earning" and
 * "spending" sound clearly different. */
export function playSpendSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [783.99, 523.25, 392.0]; // G5 -> C5 -> G4, descending
  const startTime = ctx.currentTime;

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;

    const noteStart = startTime + i * 0.08;
    const noteEnd = noteStart + 0.16;
    gain.gain.setValueAtTime(0, noteStart);
    gain.gain.linearRampToValueAtTime(0.22, noteStart + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, noteEnd);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(noteStart);
    osc.stop(noteEnd);
  });
}

/** A warm double-pulse "thump-thump" for a heart landing on a creature —
 * distinct in timbre from both the star and spend sounds. */
export function playHeartSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const startTime = ctx.currentTime;
  const pulseOffsets = [0, 0.18];

  pulseOffsets.forEach((offset) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 440; // A4

    const noteStart = startTime + offset;
    const noteEnd = noteStart + 0.15;
    gain.gain.setValueAtTime(0, noteStart);
    gain.gain.linearRampToValueAtTime(0.3, noteStart + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, noteEnd);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(noteStart);
    osc.stop(noteEnd);
  });
}
