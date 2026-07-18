/** Plays a recorded clip and resolves once it finishes — lets a caller
 * sequence it between TTS utterances, the way the "教小動物" game stitches
 * synthesized speech and the child's own recording into one continuous
 * playback. */
export function playAudioUrl(url: string): Promise<void> {
  return new Promise((resolve) => {
    const audio = new Audio(url);
    audio.onended = () => resolve();
    audio.onerror = () => resolve();
    audio.play().catch(() => resolve());
  });
}
