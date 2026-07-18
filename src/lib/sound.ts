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

/** A tiny single pop for a playful tap (petting the creature) — much
 * shorter and lighter than the other effects, so it doesn't feel heavy on
 * repeated taps. */
export function playPatSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  const start = ctx.currentTime;
  osc.frequency.setValueAtTime(700, start);
  osc.frequency.exponentialRampToValueAtTime(1000, start + 0.08);

  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(0.2, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + 0.12);
}

/** A clear, unmistakable bell "叮～" marking the exact moment recording
 * actually begins — played right after a spoken instruction, so a child
 * hears "do the thing" then an obvious "go" cue. A fundamental plus a
 * higher octave overtone (real bells ring with more than one partial) and a
 * long ringing decay, not a short blip that's easy to miss. */
export function playDingSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const start = ctx.currentTime;
  const duration = 0.8;

  [
    { freq: 1568, gain: 0.32 }, // G6, fundamental
    { freq: 3136, gain: 0.14 }, // G7, one octave up — the "shimmer"
  ].forEach(({ freq, gain: peakGain }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, start);

    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(peakGain, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration);
  });
}

/** A gentle "not quite yet" blip for trying to buy a gift without enough
 * stars — soft and friendly, not a harsh error buzzer. */
export function playInsufficientSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [392.0, 349.23]; // G4 -> F4, small gentle dip
  const startTime = ctx.currentTime;

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;

    const noteStart = startTime + i * 0.11;
    const noteEnd = noteStart + 0.2;
    gain.gain.setValueAtTime(0, noteStart);
    gain.gain.linearRampToValueAtTime(0.16, noteStart + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, noteEnd);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(noteStart);
    osc.stop(noteEnd);
  });
}

/** A quick bright arpeggio for an envelope opening. */
export function playEnvelopeSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [659.25, 830.61, 987.77]; // E5 G#5 B5
  const startTime = ctx.currentTime;

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;

    const noteStart = startTime + i * 0.06;
    const noteEnd = noteStart + 0.2;
    gain.gain.setValueAtTime(0, noteStart);
    gain.gain.linearRampToValueAtTime(0.2, noteStart + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, noteEnd);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(noteStart);
    osc.stop(noteEnd);
  });
}

/** A bigger, richer fanfare than playStarSound() — for finishing an entire
 * practice session. An ascending run followed by a held triumphant chord. */
export function playCelebrationSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const startTime = ctx.currentTime;
  const runNotes = [523.25, 659.25, 783.99, 1046.5, 1318.51]; // C5 E5 G5 C6 E6

  runNotes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;

    const noteStart = startTime + i * 0.09;
    const noteEnd = noteStart + 0.22;
    gain.gain.setValueAtTime(0, noteStart);
    gain.gain.linearRampToValueAtTime(0.22, noteStart + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, noteEnd);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(noteStart);
    osc.stop(noteEnd);
  });

  const chordStart = startTime + runNotes.length * 0.09 + 0.05;
  const chordEnd = chordStart + 0.7;
  [1046.5, 1318.51, 1567.98].forEach((freq) => {
    // C6 E6 G6 chord
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0, chordStart);
    gain.gain.linearRampToValueAtTime(0.18, chordStart + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, chordEnd);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(chordStart);
    osc.stop(chordEnd);
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
