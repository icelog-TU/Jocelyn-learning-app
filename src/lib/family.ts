const STORAGE_KEY = "hanzi-family-code";
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function getFamilyCode(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function setFamilyCode(code: string): void {
  localStorage.setItem(STORAGE_KEY, normalizeCode(code));
}

export function clearFamilyCode(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

export function generateFamilyCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

// Letters/numbers/underscore/hyphen only: safe as both a Firestore path
// segment and a localStorage key, and easy to type on a phone keyboard.
const VALID_CODE_PATTERN = /^[A-Z0-9_-]+$/;

export function isValidFamilyCode(code: string): boolean {
  const normalized = normalizeCode(code);
  return (
    normalized.length >= 4 &&
    normalized.length <= 20 &&
    VALID_CODE_PATTERN.test(normalized)
  );
}
