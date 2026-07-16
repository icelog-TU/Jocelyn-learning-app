import { useEffect, useState } from "react";
import { subscribeToSentences } from "../lib/store";
import type { SentenceDoc } from "../types";

export function useSentences(familyCode: string | null) {
  const [sentences, setSentences] = useState<SentenceDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!familyCode) {
      setSentences([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = subscribeToSentences(
      familyCode,
      (result) => {
        setSentences(result);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsubscribe;
  }, [familyCode]);

  return { sentences, loading };
}
