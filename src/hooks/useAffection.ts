import { useEffect, useState } from "react";
import { subscribeToAffection } from "../lib/store";
import type { AffectionDoc } from "../types";

export function useAffection(familyCode: string | null) {
  const [affection, setAffection] = useState<AffectionDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!familyCode) {
      setAffection([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = subscribeToAffection(
      familyCode,
      (result) => {
        setAffection(result);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsubscribe;
  }, [familyCode]);

  return { affection, loading };
}
