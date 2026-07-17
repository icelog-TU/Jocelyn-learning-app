import { useEffect, useState } from "react";
import { subscribeToPrizes } from "../lib/store";
import type { CollectedPrizeDoc } from "../types";

export function usePrizes(familyCode: string | null) {
  const [prizes, setPrizes] = useState<CollectedPrizeDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!familyCode) {
      setPrizes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = subscribeToPrizes(
      familyCode,
      (result) => {
        setPrizes(result);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsubscribe;
  }, [familyCode]);

  return { prizes, loading };
}
