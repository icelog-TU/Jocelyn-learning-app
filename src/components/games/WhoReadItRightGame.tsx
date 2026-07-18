import { useEffect, useMemo, useRef, useState } from "react";
import type { SentenceDoc } from "../../types";
import { SentenceCard } from "../SentenceCard";
import {
  speakSequence,
  DEFAULT_RATE,
  HIGHLIGHT_READING_RATE_MULTIPLIER,
  type SpeakSequenceHandle,
} from "../../lib/ttsSequence";
import { playInsufficientSound, playStarSound } from "../../lib/sound";
import { ANIMAL_EMOJIS, generateWrongVariants, shuffled } from "../../lib/sentenceGames";

interface Props {
  sentence: SentenceDoc;
  onComplete: () => void;
  onSkip: () => void;
}

interface AnimalOption {
  key: string;
  animal: string;
  chars: string[];
  isCorrect: boolean;
  pitch: number;
}

/** "誰念對了" — four animals each "read" the sentence, but only one gets
 * every character right; the other three each swap a pair of adjacent
 * characters. Tapping an animal she hasn't heard yet plays its reading
 * (interrupting whichever animal was playing, if any — she doesn't have to
 * let a wrong one finish before trying another). Tapping an animal she's
 * ALREADY heard — including the one currently mid-playback — commits it as
 * her answer right away, so she never has to wait through all four once
 * she's confident: catching a wrong character partway through, or a fully
 * correct reading, both let her act immediately instead of only after a
 * fixed "listen to everything first" gate. */
export function WhoReadItRightGame({ sentence, onComplete, onSkip }: Props) {
  const correctChars = useMemo(
    () => Array.from(sentence.text).filter((c) => /\p{Script=Han}/u.test(c)),
    [sentence.id],
  );

  const options = useMemo<AnimalOption[]>(() => {
    if (correctChars.length < 3) return [];
    const wrongVariants = generateWrongVariants(correctChars, 3);
    const animals = shuffled(ANIMAL_EMOJIS).slice(0, 4);
    const all: AnimalOption[] = [
      { key: "correct", animal: animals[0], chars: correctChars, isCorrect: true, pitch: 1.2 },
      ...wrongVariants.map((chars, i) => ({
        key: `wrong-${i}`,
        animal: animals[i + 1],
        chars,
        isCorrect: false,
        pitch: 1.2 + (i + 1) * 0.25,
      })),
    ];
    return shuffled(all);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentence.id]);

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [playedKeys, setPlayedKeys] = useState<Set<string>>(new Set());
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const [resolved, setResolved] = useState(false);
  const [wrongKey, setWrongKey] = useState<string | null>(null);
  const currentSeqRef = useRef<SpeakSequenceHandle | null>(null);

  const playable = options.length === 4;

  useEffect(() => {
    if (!playable) {
      onSkip();
      return;
    }
    // Kept short deliberately — the "tap an already-heard animal again to
    // select it" mechanic is discoverable through a tap or two, and didn't
    // need spelling out in speech every round once she'd found it once.
    speakSequence(["聽聽看下面哪隻動物念得對？"]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentence.id, playable]);

  if (!playable) return null;

  function playAnimal(opt: AnimalOption) {
    if (resolved) return;
    // Interrupts whichever animal is currently mid-reading, if any — she
    // shouldn't have to let a wrong one finish before trying the next.
    currentSeqRef.current?.cancel();
    setWrongKey(null);
    setActiveIndex(null);
    setPlayingKey(opt.key);
    const seq = speakSequence(opt.chars, {
      pitch: opt.pitch,
      rate: DEFAULT_RATE * HIGHLIGHT_READING_RATE_MULTIPLIER,
      onCharStart: setActiveIndex,
    });
    currentSeqRef.current = seq;
    seq.done.then(() => {
      if (currentSeqRef.current !== seq) return; // superseded by another tap
      setActiveIndex(null);
      setPlayingKey(null);
      setPlayedKeys((prev) => new Set(prev).add(opt.key));
    });
  }

  function selectAnimal(opt: AnimalOption) {
    if (resolved) return;
    currentSeqRef.current?.cancel();
    setPlayingKey(null);
    setActiveIndex(null);
    if (opt.isCorrect) {
      setResolved(true);
      playStarSound();
      const seq = speakSequence(["答對了！這隻動物把每個字都念對了！"]);
      seq.done.then(() => setTimeout(onComplete, 400));
    } else {
      setWrongKey(opt.key);
      playInsufficientSound();
      speakSequence(["這隻好像念錯了，再聽聽看喔"]);
    }
  }

  function handleTapAnimal(opt: AnimalOption) {
    if (resolved) return;
    const alreadyHeard = opt.key === playingKey || playedKeys.has(opt.key);
    if (alreadyHeard) selectAnimal(opt);
    else playAnimal(opt);
  }

  const phaseText = resolved
    ? "🎉 你找到念對的動物了！"
    : "🔊 點一下動物聽聽看；聽過的動物再點一次，就是選定牠！";

  return (
    <div>
      <p style={{ textAlign: "center", color: "var(--color-text-muted)", margin: "0 0 12px", minHeight: "1.4em" }}>
        {phaseText}
      </p>
      <SentenceCard sentence={sentence.text} lineBreaks={sentence.lineBreaks} activeIndex={activeIndex} />

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 14,
          margin: "20px 0",
        }}
      >
        {options.map((opt) => {
          const playing = playingKey === opt.key;
          const heard = playing || playedKeys.has(opt.key);
          const isWrongPick = wrongKey === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => handleTapAnimal(opt)}
              disabled={resolved}
              aria-label={
                playing
                  ? `動物${opt.animal}正在念，再點一次選定牠`
                  : heard
                    ? `動物${opt.animal}，已經聽過，再點一次選定牠`
                    : `動物${opt.animal}，點一下聽牠念句子`
              }
              className={isWrongPick ? "char-shake" : undefined}
              style={{
                width: 76,
                height: 76,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2.4rem",
                borderRadius: 20,
                border: playing ? "3px solid var(--color-primary)" : heard ? "3px solid #cdeccd" : "3px solid #eee0d0",
                background: playing ? "#fff1e2" : heard ? "#f2fbf2" : "#fff",
                cursor: resolved ? "default" : "pointer",
                opacity: resolved && !opt.isCorrect ? 0.5 : 1,
                transition: "transform 0.15s",
                transform: playing ? "scale(1.08)" : "scale(1)",
              }}
            >
              {opt.animal}
            </button>
          );
        })}
      </div>

      <div style={{ textAlign: "center" }}>
        <button
          onClick={onSkip}
          style={{
            background: "none",
            border: "none",
            color: "var(--color-text-muted)",
            fontSize: "0.85rem",
            textDecoration: "underline",
            cursor: "pointer",
          }}
        >
          先跳過
        </button>
      </div>
    </div>
  );
}
