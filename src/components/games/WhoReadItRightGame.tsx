import { useEffect, useMemo, useState } from "react";
import type { SentenceDoc } from "../../types";
import { SentenceCard } from "../SentenceCard";
import { speakSequence } from "../../lib/ttsSequence";
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
 * characters. She must listen to all four (tapping just plays that animal's
 * reading, highlighting the matching position on the reference card as it
 * goes — including for the wrong ones, which is an honest mismatch since
 * the wrong readings are same-length swaps of the real sentence) before she
 * can pick the one she thinks is correct. */
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

  const playable = options.length === 4;
  const phase: "listening" | "choosing" = playedKeys.size >= options.length ? "choosing" : "listening";

  useEffect(() => {
    if (!playable) {
      onSkip();
      return;
    }
    speakSequence(["聽聽看，哪一隻動物把句子念對了？點一下動物，聽聽牠怎麼念吧！"]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentence.id, playable]);

  if (!playable) return null;

  function playAnimal(opt: AnimalOption) {
    if (playingKey || resolved) return;
    setWrongKey(null);
    setPlayingKey(opt.key);
    const seq = speakSequence(opt.chars, {
      pitch: opt.pitch,
      onCharStart: setActiveIndex,
    });
    seq.done.then(() => {
      setActiveIndex(null);
      setPlayingKey(null);
      setPlayedKeys((prev) => new Set(prev).add(opt.key));
    });
  }

  function selectAnimal(opt: AnimalOption) {
    if (phase !== "choosing" || playingKey || resolved) return;
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

  const phaseText = resolved
    ? "🎉 你找到念對的動物了！"
    : phase === "listening"
      ? `🔊 點一下動物，聽聽牠怎麼念（${playedKeys.size}/${options.length}）`
      : "🤔 你覺得哪一隻動物念對了？點牠一下選選看";

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
          const played = playedKeys.has(opt.key);
          const isWrongPick = wrongKey === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => (phase === "choosing" ? selectAnimal(opt) : playAnimal(opt))}
              disabled={resolved || (playingKey !== null && playingKey !== opt.key)}
              aria-label={
                phase === "choosing" ? `動物${opt.animal}，選牠念對了` : `動物${opt.animal}，點一下聽牠念句子`
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
                border:
                  playingKey === opt.key
                    ? "3px solid var(--color-primary)"
                    : played
                      ? "3px solid #cdeccd"
                      : "3px solid #eee0d0",
                background: playingKey === opt.key ? "#fff1e2" : played ? "#f2fbf2" : "#fff",
                cursor: resolved ? "default" : "pointer",
                opacity: resolved && !opt.isCorrect ? 0.5 : 1,
                transition: "transform 0.15s",
                transform: playingKey === opt.key ? "scale(1.08)" : "scale(1)",
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
