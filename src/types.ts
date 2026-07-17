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

export interface SentenceDoc {
  id: string;
  text: string;
  sourceChars: string[];
  difficulty: SentenceDifficulty;
  createdAt: number;
  stats: CharacterStats;
}

/** A single character flagged as needing extra practice (learned but hard
 * to read). AI sentence generation tries to weave these in opportunistically. */
export interface WeakCharDoc {
  id: string;
  hanzi: string;
  addedAt: number;
}
