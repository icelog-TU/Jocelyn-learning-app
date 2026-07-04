import { useCallback, useEffect, useState } from "react";
import {
  clearFamilyCode,
  generateFamilyCode,
  getFamilyCode,
  normalizeCode,
  setFamilyCode,
} from "../lib/family";
import { ensureSignedIn, isFirebaseConfigured } from "../lib/firebase";

export function useFamily() {
  const [familyCode, setFamilyCodeState] = useState<string | null>(() => getFamilyCode());
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    ensureSignedIn()
      .then(() => setAuthReady(true))
      .catch((err) => setAuthError(err.message));
  }, []);

  // Only generates a candidate code for the user to confirm; does not persist
  // it. Committing happens via joinFamily once the parent has seen the code.
  const previewNewCode = useCallback(() => generateFamilyCode(), []);

  const joinFamily = useCallback((code: string) => {
    const normalized = normalizeCode(code);
    setFamilyCode(normalized);
    setFamilyCodeState(normalized);
    return normalized;
  }, []);

  const leaveFamily = useCallback(() => {
    clearFamilyCode();
    setFamilyCodeState(null);
  }, []);

  return {
    familyCode,
    authReady: !isFirebaseConfigured || authReady,
    authError,
    previewNewCode,
    joinFamily,
    leaveFamily,
  };
}
