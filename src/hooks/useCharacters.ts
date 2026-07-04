import { useEffect, useState } from "react";
import { subscribeToCharacters } from "../lib/store";
import type { CharacterDoc } from "../types";

export function useCharacters(familyCode: string | null) {
  const [characters, setCharacters] = useState<CharacterDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!familyCode) {
      setCharacters([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = subscribeToCharacters(
      familyCode,
      (chars) => {
        setCharacters(chars);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
    return unsubscribe;
  }, [familyCode]);

  return { characters, loading, error };
}
