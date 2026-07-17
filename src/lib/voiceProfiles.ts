import type { CreatureVariant } from "../types";

export interface RoleVoiceProfile {
  rate: number;
  pitch: number;
  /** Substrings to look for (case-insensitive) in a SpeechSynthesisVoice's
   * name when picking a real system voice for this role. Best-effort only —
   * most browsers expose just 0-2 Chinese voices total, so this frequently
   * falls back to whatever default voice is available; rate/pitch below are
   * the reliable differentiator across all browsers. */
  voiceNameHints: string[];
  /** Babies don't really "read sentences" — content for this role should
   * stay to short exclamations/giggles rather than full TTS reads of long
   * text, since synthesized baby speech never sounds convincing either way. */
  preferShortExclamations: boolean;
}

/** Single source of truth for how each family role sounds when spoken aloud.
 * Every place that voices a creature's dialogue should go through
 * speakAsRole() (see voiceProvider.ts) instead of hand-tuning rate/pitch
 * inline, so all 9 roles stay consistent and tunable in one place. */
export const VARIANT_VOICE_PROFILES: Record<CreatureVariant, RoleVoiceProfile> = {
  grandpa: { rate: 0.72, pitch: 0.55, voiceNameHints: ["male", "man", "先生"], preferShortExclamations: false },
  grandma: { rate: 0.78, pitch: 0.8, voiceNameHints: ["female", "woman", "小姐"], preferShortExclamations: false },
  dad: { rate: 0.95, pitch: 0.7, voiceNameHints: ["male", "man"], preferShortExclamations: false },
  mom: { rate: 0.95, pitch: 1.05, voiceNameHints: ["female", "woman"], preferShortExclamations: false },
  olderBrother: { rate: 1.05, pitch: 1.15, voiceNameHints: ["male", "man"], preferShortExclamations: false },
  olderSister: { rate: 1.05, pitch: 1.3, voiceNameHints: ["female", "woman"], preferShortExclamations: false },
  youngerBrother: { rate: 1.15, pitch: 1.4, voiceNameHints: ["male", "man"], preferShortExclamations: false },
  youngerSister: { rate: 1.15, pitch: 1.45, voiceNameHints: ["female", "woman"], preferShortExclamations: false },
  baby: { rate: 1.05, pitch: 1.85, voiceNameHints: [], preferShortExclamations: true },
};
