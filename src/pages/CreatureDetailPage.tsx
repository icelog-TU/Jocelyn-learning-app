import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { AffectionDoc, CharacterDoc, CollectedPrizeDoc, CreatureVariant, SentenceDoc } from "../types";
import { computeTotalStars } from "../lib/sentencePractice";
import { giveGiftToCreature } from "../lib/store";
import { speakAsRole } from "../lib/voiceProvider";
import { speak } from "../lib/speech";
import { playEnvelopeSound, playHeartSound, playInsufficientSound, playPatSound, playSpendSound } from "../lib/sound";
import { FriendshipPath } from "../components/FriendshipPath";
import { GiftCard } from "../components/GiftCard";
import { HeartProgress } from "../components/HeartProgress";
import { FloatingDelta } from "../components/FloatingDelta";
import { StarBurst } from "../components/StarBurst";
import {
  CREATURE_VARIANTS,
  GIFT_OPTIONS,
  VARIANT_BADGES,
  VARIANT_LABELS,
  computeAvailableStars,
  prizeKey,
  speciesById,
} from "../lib/gachaCatalog";
import {
  AFFECTION_STAGES,
  MAX_HEARTS,
  currentStageIndex,
  fearText,
  firstMeetingText,
  letterText,
  likesText,
  playActionText,
  randomGreeting,
  randomPatReaction,
  randomThanks,
  secretFactText,
  secretIntroText,
  speciesFacts,
} from "../lib/affectionContent";
import "./CreatureDetailPage.css";

interface Props {
  characters: CharacterDoc[];
  sentences: SentenceDoc[];
  prizes: CollectedPrizeDoc[];
  affection: AffectionDoc[];
  familyCode: string;
}

const MOOD_EMOJI = ["😐", "🙂", "😊", "🥰", "🤩"];

/** Reset styles so the stage-panel-title <button> keeps the .stage-panel-title
 * class's layout (flex, gap, font-weight) without looking like a button. */
const stagePanelTitleResetStyle: CSSProperties = {
  background: "none",
  border: "none",
  padding: 0,
  cursor: "pointer",
  textAlign: "left",
  color: "inherit",
  fontFamily: "inherit",
  fontSize: "inherit",
  width: "100%",
};

export function CreatureDetailPage({ characters, sentences, prizes, affection, familyCode }: Props) {
  const { speciesId = "", variant = "" } = useParams<{ speciesId: string; variant: string }>();
  const species = speciesById(speciesId);
  const isValidVariant = (CREATURE_VARIANTS as string[]).includes(variant);
  const typedVariant = (isValidVariant ? variant : "baby") as CreatureVariant;

  const key = prizeKey(speciesId, typedVariant);
  const record = affection.find((a) => a.id === key);
  const hearts = record?.hearts ?? 0;

  const totalStars = computeTotalStars(characters, sentences);
  const available = computeAvailableStars(totalStars, prizes.length, affection);

  // Hooks must run unconditionally every render, so they're all declared up
  // here, above the early-return guards below.
  const [displayedAvailable, setDisplayedAvailable] = useState(available);
  const [displayedHearts, setDisplayedHearts] = useState(hearts);
  const [spendFx, setSpendFx] = useState<{ cost: number; key: number }>({ cost: 0, key: 0 });
  const [heartFx, setHeartFx] = useState<{ gain: number; key: number }>({ gain: 0, key: 0 });
  const [giving, setGiving] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [insufficientMsg, setInsufficientMsg] = useState(false);
  const [maxedMsg, setMaxedMsg] = useState(false);
  const [giftFlyFx, setGiftFlyFx] = useState<{ emoji: string; key: number }>({ emoji: "", key: 0 });
  const [reactKey, setReactKey] = useState(0);
  const [burstKey, setBurstKey] = useState(0);
  const [envelopeOpen, setEnvelopeOpen] = useState(false);
  const [greetingText, setGreetingText] = useState("");
  const [patText, setPatText] = useState("");
  const [patKey, setPatKey] = useState(0);
  const animatingRef = useRef(false);
  const tickTimerRef = useRef<number | null>(null);
  const heartsAnimatingRef = useRef(false);
  const heartsTickTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!animatingRef.current) setDisplayedAvailable(available);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [available]);

  useEffect(() => {
    if (!heartsAnimatingRef.current) setDisplayedHearts(hearts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hearts]);

  useEffect(() => {
    return () => {
      if (tickTimerRef.current !== null) window.clearInterval(tickTimerRef.current);
      if (heartsTickTimerRef.current !== null) window.clearInterval(heartsTickTimerRef.current);
    };
  }, []);

  // Reset per-creature ephemeral UI state when navigating between creatures
  // (the route component instance is reused, so this can't rely on remount).
  useEffect(() => {
    setEnvelopeOpen(false);
    setGreetingText("");
    setPatText("");
    heartsAnimatingRef.current = false;
    setDisplayedHearts(hearts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Purchase feedback is intentionally slow (roughly 0.6-1.2s total) so a
  // child can actually watch the number change, not just see it jump.
  const FEEDBACK_BUDGET_MS = 1200;

  function animateSpend(from: number, to: number) {
    animatingRef.current = true;
    if (tickTimerRef.current !== null) window.clearInterval(tickTimerRef.current);
    const steps = from - to;
    const stepMs = Math.max(80, Math.min(300, FEEDBACK_BUDGET_MS / Math.max(steps, 1)));
    let current = from;
    tickTimerRef.current = window.setInterval(() => {
      current -= 1;
      setDisplayedAvailable(current);
      if (current <= to) {
        if (tickTimerRef.current !== null) window.clearInterval(tickTimerRef.current);
        animatingRef.current = false;
      }
    }, stepMs);
  }

  function animateHeartsGain(from: number, to: number) {
    heartsAnimatingRef.current = true;
    if (heartsTickTimerRef.current !== null) window.clearInterval(heartsTickTimerRef.current);
    const steps = to - from;
    const stepMs = Math.max(80, Math.min(300, FEEDBACK_BUDGET_MS / Math.max(steps, 1)));
    let current = from;
    heartsTickTimerRef.current = window.setInterval(() => {
      current += 1;
      setDisplayedHearts(current);
      if (current >= to) {
        if (heartsTickTimerRef.current !== null) window.clearInterval(heartsTickTimerRef.current);
        heartsAnimatingRef.current = false;
      }
    }, stepMs);
  }

  async function handleGift(giftId: string) {
    if (giving || !species) return;
    const gift = GIFT_OPTIONS.find((g) => g.id === giftId);
    if (!gift) return;

    if (hearts >= MAX_HEARTS) {
      // "最好的朋友" is the last stage — hearts past this point don't
      // unlock anything, so letting a gift go through here would just
      // spend stars for nothing.
      playInsufficientSound();
      speak(`${displayName}已經是最好的朋友了，愛心已經點滿，不用再送禮物囉！`);
      setMaxedMsg(true);
      window.setTimeout(() => setMaxedMsg(false), 2200);
      return;
    }

    if (available < gift.cost) {
      playInsufficientSound();
      speak("可用星星不夠，要多練習賺星星，才能買東西喔。");
      setShakeKey(Date.now());
      setInsufficientMsg(true);
      window.setTimeout(() => setInsufficientMsg(false), 2200);
      return;
    }

    setGiving(true);
    playSpendSound();
    setSpendFx({ cost: gift.cost, key: Date.now() });
    setGiftFlyFx({ emoji: gift.emoji, key: Date.now() });
    animateSpend(displayedAvailable, displayedAvailable - gift.cost);
    // Block the hearts prop → displayedHearts sync while we wait, so the
    // underlying value updating early (as soon as the write resolves)
    // doesn't make the heart row jump ahead of the deliberately slow reveal.
    heartsAnimatingRef.current = true;
    const startHearts = hearts;

    await giveGiftToCreature(familyCode, speciesId, typedVariant, gift.hearts, gift.cost);

    window.setTimeout(() => {
      playHeartSound();
      animateHeartsGain(startHearts, startHearts + gift.hearts);
      setHeartFx({ gain: gift.hearts, key: Date.now() });
      setBurstKey((k) => k + 1);
      setReactKey(Date.now());
      const thanks = randomThanks(typedVariant);
      speakAsRole(thanks, typedVariant);
      setGiving(false);
    }, 500);
  }

  // Tapping the portrait always introduces the creature by name — helpful
  // for a child who can't read the page title above it — and, once "一起
  // 玩" is unlocked, also plays a pat reaction. Both are said as a single
  // utterance (voiceProvider cancels any speech already in progress when a
  // new one starts, so two separate speakAsRole calls back to back would
  // just cut each other off).
  function handlePortraitTap() {
    if (!species) return;
    const intro = `我是${displayName}。`;
    if (currentStageIndex(hearts) < 2) {
      speakAsRole(intro, typedVariant);
      return;
    }
    playPatSound();
    setReactKey(Date.now());
    const reaction = randomPatReaction(typedVariant);
    setPatText(reaction);
    setPatKey(Date.now());
    speakAsRole(`${intro}${reaction}`, typedVariant);
  }

  function handleGreet() {
    if (!species) return;
    const line = randomGreeting(`${species.name}${VARIANT_LABELS[typedVariant]}`, typedVariant);
    setGreetingText(line);
    setReactKey(Date.now());
    speakAsRole(line, typedVariant);
  }

  function handleToggleEnvelope() {
    if (!species) return;
    setEnvelopeOpen((open) => {
      const next = !open;
      if (next) {
        playEnvelopeSound();
        speakAsRole(letterText(`${species.name}${VARIANT_LABELS[typedVariant]}`, typedVariant), typedVariant);
      }
      return next;
    });
  }

  if (!species || !isValidVariant) {
    return (
      <div className="screen">
        <h1 className="page-title">找不到這隻怪獸</h1>
        <Link to="/gacha" className="btn btn-outline btn-block">
          回轉蛋頁
        </Link>
      </div>
    );
  }

  const ownedCount = prizes.filter((p) => p.speciesId === speciesId && p.variant === typedVariant).length;
  const displayName = `${species.name}${VARIANT_LABELS[typedVariant]}`;
  const stageIdx = currentStageIndex(hearts);
  const moodEmoji = MOOD_EMOJI[stageIdx];

  /** Renders the interactive content for one friendship-path stage. Called
   * for every currently-unlocked stage (not just the highest one), so a
   * parent can scroll down and revisit earlier stages instead of them
   * disappearing the moment a new one unlocks. */
  function renderStagePanel(idx: number) {
    if (!species) return null;
    const heartLabel = idx > 0 ? `（❤️${AFFECTION_STAGES[idx].threshold}）` : "";
    const stageTitleStyle = { ...stagePanelTitleResetStyle };

    if (idx === 0) {
      const text = firstMeetingText(displayName, typedVariant);
      return (
        <>
          <button
            type="button"
            className="stage-panel-title"
            style={stageTitleStyle}
            onClick={() => speak("初次見面")}
          >
            🌱 初次見面
          </button>
          <p style={{ margin: "0 0 10px" }}>{text}</p>
          <button className="btn btn-outline" onClick={() => speakAsRole(text, typedVariant)}>
            🔊 播放
          </button>
        </>
      );
    }

    if (idx === 1) {
      return (
        <>
          <button
            type="button"
            className="stage-panel-title"
            style={stageTitleStyle}
            onClick={() => speak(`打招呼，需要 ${AFFECTION_STAGES[idx].threshold} 顆愛心`)}
          >
            👋 打招呼{heartLabel}
          </button>
          {greetingText && <p style={{ margin: "0 0 10px", fontSize: "1.1rem" }}>{greetingText}</p>}
          <button className="btn btn-primary btn-block" onClick={handleGreet}>
            🔊 跟{displayName}打招呼
          </button>
        </>
      );
    }

    if (idx === 2) {
      const playAction = playActionText(typedVariant);
      return (
        <>
          <button
            type="button"
            className="stage-panel-title"
            style={stageTitleStyle}
            onClick={() => speak(`一起玩，需要 ${AFFECTION_STAGES[idx].threshold} 顆愛心`)}
          >
            🤗 一起玩{heartLabel}
          </button>
          <button
            type="button"
            style={{
              ...stageTitleStyle,
              fontWeight: "normal",
              color: "var(--color-text-muted)",
              fontSize: "0.9rem",
              marginBottom: 10,
            }}
            onClick={() => speak(`點一下上面的${displayName}，${playAction}！`)}
          >
            點一下上面的{displayName}，{playAction}！
          </button>
          {patText && (
            <p style={{ fontWeight: 700, fontSize: "1.1rem", margin: 0 }}>{patText}</p>
          )}
        </>
      );
    }

    if (idx === 3) {
      return (
        <>
          <button
            type="button"
            className="stage-panel-title"
            style={stageTitleStyle}
            onClick={() => speak(`一封信，需要 ${AFFECTION_STAGES[idx].threshold} 顆愛心`)}
          >
            💌 一封信{heartLabel}
          </button>
          {envelopeOpen ? (
            <div className="envelope-reveal" style={{ textAlign: "center" }}>
              <div style={{ fontSize: "2.5rem" }}>
                {species.emoji}✨
              </div>
              <p style={{ margin: "10px 0", fontSize: "1.05rem" }}>{letterText(displayName, typedVariant)}</p>
              <button
                className="btn btn-outline"
                onClick={() => speakAsRole(letterText(displayName, typedVariant), typedVariant)}
              >
                🔊 播放
              </button>
            </div>
          ) : (
            <div style={{ textAlign: "center" }}>
              <span className="envelope" onClick={handleToggleEnvelope} role="button" aria-label="打開信封">
                💌
              </span>
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", marginTop: 8 }}>
                點一下信封，打開看看！
              </p>
            </div>
          )}
        </>
      );
    }

    const facts = speciesFacts(speciesId);
    const secretLine = secretIntroText(displayName, typedVariant);
    return (
      <>
        <button
          type="button"
          className="stage-panel-title"
          style={stageTitleStyle}
          onClick={() => speak(`最好的朋友，需要 ${AFFECTION_STAGES[idx].threshold} 顆愛心`)}
        >
          💖 最好的朋友{heartLabel}
        </button>
        <p style={{ margin: "0 0 10px" }}>{secretLine}</p>
        <div className="profile-card-grid">
          <button
            type="button"
            className="profile-card-row"
            onClick={() => speakAsRole(likesText(displayName, speciesId), typedVariant)}
          >
            <span className="profile-card-icon">😍</span>
            <div>
              <span className="profile-card-label">喜歡</span>
              <span className="profile-card-value">{facts?.likes}</span>
            </div>
          </button>
          <button
            type="button"
            className="profile-card-row"
            onClick={() => speakAsRole(fearText(displayName, speciesId), typedVariant)}
          >
            <span className="profile-card-icon">😱</span>
            <div>
              <span className="profile-card-label">害怕</span>
              <span className="profile-card-value">{facts?.fear}</span>
            </div>
          </button>
          <button
            type="button"
            className="profile-card-row"
            onClick={() => speakAsRole(secretFactText(displayName, speciesId), typedVariant)}
          >
            <span className="profile-card-icon">🤫</span>
            <div>
              <span className="profile-card-label">小秘密</span>
              <span className="profile-card-value">{facts?.secret}</span>
            </div>
          </button>
        </div>
        <button
          className="btn btn-outline btn-block"
          style={{ marginTop: 12 }}
          onClick={() => speakAsRole(`${secretLine}${facts?.secret ?? ""}`, typedVariant)}
        >
          🔊 播放秘密
        </button>
      </>
    );
  }

  return (
    <div className="screen">
      <h1 className="page-title">{displayName}</h1>
      {ownedCount > 1 && (
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", marginTop: -8 }}>
          已經轉到 {ownedCount} 隻
        </p>
      )}

      <div className="card" style={{ marginBottom: 16, textAlign: "center" }}>
        <div
          className="creature-portrait tappable"
          onClick={handlePortraitTap}
          role="button"
          aria-label={`聽${displayName}自我介紹`}
        >
          <div
            key={reactKey}
            className={`creature-emoji-wrap${reactKey ? " creature-reacting" : ""}`}
            style={{ "--bob-amount": `-${4 + stageIdx * 2}px` } as React.CSSProperties}
          >
            <span className="creature-emoji-big">{species.emoji}</span>
            <span className="creature-badge">{VARIANT_BADGES[typedVariant]}</span>
          </div>
          <span className="creature-mood-badge">{moodEmoji}</span>
          {giftFlyFx.key !== 0 && (
            <span key={giftFlyFx.key} className="gift-fly">
              {giftFlyFx.emoji}
            </span>
          )}
          <StarBurst burstKey={burstKey} emoji="❤️" />
          <FloatingDelta text={`+${heartFx.gain}❤️`} triggerKey={heartFx.key} color="var(--color-success)" />
          <FloatingDelta text={patText} triggerKey={patKey} color="var(--color-primary-dark)" />
        </div>

        <HeartProgress filled={displayedHearts} />
        <FriendshipPath hearts={hearts} variant={typedVariant} />
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <button
          type="button"
          style={{
            fontWeight: 700,
            margin: "0 0 10px",
            position: "relative",
            textAlign: "center",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: "inherit",
            color: "inherit",
            width: "100%",
          }}
          onClick={() => speak(`可用星星，${displayedAvailable} 顆`)}
        >
          <FloatingDelta text={`-${spendFx.cost}⭐️`} triggerKey={spendFx.key} color="var(--color-danger)" />
          ⭐️ 可用星星：
          <span key={shakeKey} className={`star-balance${shakeKey ? " shake" : ""}`}>
            <span key={spendFx.key} className={spendFx.key ? "pill-pop" : undefined} style={{ display: "inline-block" }}>
              {displayedAvailable}
            </span>
          </span>
        </button>
        {insufficientMsg && (
          <p style={{ textAlign: "center", color: "var(--color-danger)", fontSize: "0.85rem", margin: "0 0 10px" }}>
            再學幾個字，就有星星送禮物囉
          </p>
        )}
        {maxedMsg && (
          <p style={{ textAlign: "center", color: "var(--color-danger)", fontSize: "0.85rem", margin: "0 0 10px" }}>
            愛心已經點滿，不用再送禮物囉
          </p>
        )}
        {hearts >= MAX_HEARTS ? (
          <p style={{ textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.9rem", margin: 0 }}>
            💖 已經是最好的朋友了，愛心點滿囉！
          </p>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            {GIFT_OPTIONS.map((gift) => (
              <GiftCard
                key={gift.id}
                gift={gift}
                affordable={available >= gift.cost}
                disabled={giving}
                onClick={() => handleGift(gift.id)}
              />
            ))}
          </div>
        )}
      </div>

      {Array.from({ length: stageIdx + 1 }, (_, i) => stageIdx - i).map((idx) => (
        <div className="card" style={{ marginBottom: 12 }} key={idx}>
          {renderStagePanel(idx)}
        </div>
      ))}

      <Link to="/gacha" className="btn btn-outline btn-block" style={{ marginTop: 4 }}>
        回轉蛋頁
      </Link>
    </div>
  );
}
