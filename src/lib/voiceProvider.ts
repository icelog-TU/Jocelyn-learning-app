import type { CreatureVariant } from "../types";
import { VARIANT_VOICE_PROFILES, type RoleVoiceProfile } from "./voiceProfiles";

export interface VoiceProvider {
  speak(text: string, profile: RoleVoiceProfile): void;
}

let cachedVoices: SpeechSynthesisVoice[] | null = null;

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  // Chrome/Android often populate the voice list asynchronously after the
  // page loads; invalidate the cache so the next speak() call picks it up.
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = null;
  };
}

function getChineseVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  if (!cachedVoices) {
    cachedVoices = window.speechSynthesis.getVoices().filter((v) => /zh|chinese/i.test(v.lang));
  }
  return cachedVoices;
}

function pickVoice(hints: string[]): SpeechSynthesisVoice | undefined {
  const voices = getChineseVoices();
  if (voices.length === 0) return undefined;
  const matched = hints.length > 0 ? voices.find((v) => hints.some((h) => v.name.toLowerCase().includes(h))) : undefined;
  return matched ?? voices[0];
}

/** Default provider: the browser's built-in Web Speech API. Real distinct
 * voice "actors" per role aren't reliably available this way (most browsers
 * expose only a handful of zh-TW voices total, sometimes just one), so
 * rate/pitch carry most of the differentiation; voice selection is a
 * best-effort bonus layered on top where the browser happens to expose more
 * than one Chinese voice. */
export const webSpeechVoiceProvider: VoiceProvider = {
  speak(text, profile) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "zh-TW";
      utterance.rate = profile.rate;
      utterance.pitch = profile.pitch;
      const voice = pickVoice(profile.voiceNameHints);
      if (voice) utterance.voice = voice;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } catch {
      // Called inline from onClick handlers purely for auditory feedback —
      // a throw from cancel()/speak() on some device shouldn't be able to
      // silently abort whatever the button was actually supposed to do.
    }
  },
};

let activeProvider: VoiceProvider = webSpeechVoiceProvider;

/** Swap in a different voice backend (pre-generated audio files keyed by
 * role+text, a cloud TTS API, etc.) without touching any call site — every
 * speakAsRole() call goes through whichever provider is currently active.
 * Nothing in this app calls this yet; it exists so a future richer-voice
 * backend can be dropped in later. */
export function setVoiceProvider(provider: VoiceProvider): void {
  activeProvider = provider;
}

export function speakAsRole(text: string, variant: CreatureVariant): void {
  activeProvider.speak(text, VARIANT_VOICE_PROFILES[variant]);
}
