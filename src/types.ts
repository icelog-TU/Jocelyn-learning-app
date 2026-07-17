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
