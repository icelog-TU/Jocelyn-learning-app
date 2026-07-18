import { useEffect, useState } from "react";
import { subscribeToPlannedChars } from "../lib/store";
import type { PlannedCharacterDoc } from "../types";

export function usePlannedChars(familyCode: string | null) {
  const [plannedChars, setPlannedChars] = useState<PlannedCharacterDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!familyCode) {
      setPlannedChars([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = subscribeToPlannedChars(
      familyCode,
      (result) => {
        setPlannedChars(result);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsubscribe;
  }, [familyCode]);

  return { plannedChars, loading };
}
