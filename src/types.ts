export interface CharacterStats {
  reviewCount: number;
  correctCount: number;
  box: number;
  lastReviewedAt: number | null;
}

export interface CharacterDoc {
  id: string;
  hanzi: string;
  zhuyin: string;
  bookTitle: string;
  addedAt: number;
  addedDateKey: string;
  stats: CharacterStats;
  /** True for characters prepared ahead of time in 老師準備區 that the child
   * hasn't started learning yet. Staged characters are excluded from every
   * normal screen (home stats, history, practice, AI "known characters"
   * context) — they only show up in the teacher-prep page until released. */
  staged?: boolean;
}

export interface NewCharacterInput {
  hanzi: string;
  zhuyin: string;
}

export type SentenceDifficulty = "easy" | "medium" | "hard";

/** Where a sentence's text came from: "ai" = untouched AI output,
 * "user" = typed by the parent from scratch, "edited" = AI output the
 * parent modified. Used to pick good few-shot examples for future
 * generations and to show provenance in the UI. */
export type SentenceOrigin = "ai" | "user" | "edited";

export interface SentenceDoc {
  id: string;
  text: string;
  sourceChars: string[];
  difficulty: SentenceDifficulty;
  origin: SentenceOrigin;
  createdAt: number;
  stats: CharacterStats;
  /** Manually-chosen positions (character offsets into `text`, sorted) where
   * the vertical-reading layout should start a new column, so a parent can
   * fix mechanical/awkward line breaks (e.g. splitting "一隻" from "大黑狗")
   * into natural phrase breaks. Undefined/empty falls back to the automatic
   * fixed-length chunking. Cleared whenever `text` is edited, since old
   * offsets would no longer line up with the new text. */
  lineBreaks?: number[];
  /** True for sentences prepared ahead of time in 老師準備區, alongside a
   * staged CharacterDoc, that the child hasn't started learning yet. See
   * CharacterDoc.staged. */
  staged?: boolean;
}

export interface NewSentenceEntry {
  text: string;
  origin: SentenceOrigin;
}

/** A single character flagged as needing extra practice (learned but hard
 * to read). AI sentence generation tries to weave these in opportunistically. */
export interface WeakCharDoc {
  id: string;
  hanzi: string;
  addedAt: number;
}

/** A character the parent has decided to teach on some future day, but
 * hasn't started preparing sentences for yet — a lightweight ordered To-Do
 * list shown in 老師準備區, separate from CharacterDoc.staged (which is for
 * characters that already have a full prepared batch of sentences). Order is
 * encoded by `createdAt` (ascending); reordering rewrites that field rather
 * than needing a separate position field. */
export interface PlannedCharacterDoc {
  id: string;
  hanzi: string;
  createdAt: number;
}

export type CreatureVariant =
  | "grandpa"
  | "grandma"
  | "dad"
  | "mom"
  | "olderBrother"
  | "olderSister"
  | "youngerBrother"
  | "youngerSister"
  | "baby";

/** One gacha draw's result: a family-member variant of a creature species. */
export interface CollectedPrizeDoc {
  id: string;
  speciesId: string;
  variant: CreatureVariant;
  obtainedAt: number;
}

/** Affection progress for one owned species+variant creature. `hearts` is a
 * simple cumulative counter (gifts never decay it); `starsSpent` is the
 * lifetime stars spent gifting this creature, used to compute the family's
 * remaining star balance alongside gacha draw spending. */
export interface AffectionDoc {
  id: string;
  speciesId: string;
  variant: CreatureVariant;
  hearts: number;
  starsSpent: number;
  updatedAt: number;
}
