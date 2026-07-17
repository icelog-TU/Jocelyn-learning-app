import { useEffect, useState } from "react";
import { subscribeToWeakChars } from "../lib/store";
import type { WeakCharDoc } from "../types";

export function useWeakChars(familyCode: string | null) {
  const [weakChars, setWeakChars] = useState<WeakCharDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!familyCode) {
      setWeakChars([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = subscribeToWeakChars(
      familyCode,
      (result) => {
        setWeakChars(result);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsubscribe;
  }, [familyCode]);

  return { weakChars, loading };
}
