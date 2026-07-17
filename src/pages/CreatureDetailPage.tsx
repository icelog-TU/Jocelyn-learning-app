import { Link, useParams } from "react-router-dom";
import type { AffectionDoc, CharacterDoc, CollectedPrizeDoc, CreatureVariant, SentenceDoc } from "../types";
import { computeTotalStars } from "../lib/sentencePractice";
import { giveGiftToCreature } from "../lib/store";
import { speak } from "../lib/speech";
import { HeartMeter } from "../components/HeartMeter";
import {
  AFFECTION_MILESTONES,
  CREATURE_VARIANTS,
  GACHA_COST,
  GIFT_OPTIONS,
  VARIANT_BADGES,
  VARIANT_LABELS,
  prizeKey,
  speciesById,
} from "../lib/gachaCatalog";
import { AFFECTION_STAGE_TITLES, affectionStageText } from "../lib/affectionContent";

interface Props {
  characters: CharacterDoc[];
  sentences: SentenceDoc[];
  prizes: CollectedPrizeDoc[];
  affection: AffectionDoc[];
  familyCode: string;
}

export function CreatureDetailPage({ characters, sentences, prizes, affection, familyCode }: Props) {
  const { speciesId = "", variant = "" } = useParams<{ speciesId: string; variant: string }>();
  const species = speciesById(speciesId);
  const isValidVariant = (CREATURE_VARIANTS as string[]).includes(variant);

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

  const typedVariant = variant as CreatureVariant;
  const ownedCount = prizes.filter((p) => p.speciesId === speciesId && p.variant === typedVariant).length;
  const displayName = `${species.name}${VARIANT_LABELS[typedVariant]}`;

  if (ownedCount === 0) {
    return (
      <div className="screen">
        <h1 className="page-title">你還沒有轉到這隻</h1>
        <p style={{ color: "var(--color-text-muted)" }}>快去轉蛋看看能不能轉到「{displayName}」吧！</p>
        <Link to="/gacha" className="btn btn-primary btn-block">
          回轉蛋頁
        </Link>
      </div>
    );
  }

  const key = prizeKey(speciesId, typedVariant);
  const record = affection.find((a) => a.id === key);
  const hearts = record?.hearts ?? 0;

  const totalStars = computeTotalStars(characters, sentences);
  const spentOnDraws = prizes.length * GACHA_COST;
  const spentOnGifts = affection.reduce((sum, a) => sum + a.starsSpent, 0);
  const available = totalStars - spentOnDraws - spentOnGifts;

  async function handleGift(giftId: string) {
    const gift = GIFT_OPTIONS.find((g) => g.id === giftId);
    if (!gift || available < gift.cost) return;
    await giveGiftToCreature(familyCode, speciesId, typedVariant, gift.hearts, gift.cost);
  }

  const nextMilestone = AFFECTION_MILESTONES.find((m) => hearts < m);

  return (
    <div className="screen">
      <h1 className="page-title">
        {species.emoji}
        {VARIANT_BADGES[typedVariant]} {displayName}
      </h1>
      {ownedCount > 1 && (
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", marginTop: -8 }}>
          已經轉到 {ownedCount} 隻
        </p>
      )}

      <div className="card" style={{ marginBottom: 16, textAlign: "center" }}>
        <HeartMeter hearts={hearts} />
        <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
          {nextMilestone ? `再 ${nextMilestone - hearts} 點好感度解鎖新互動` : "已經是最要好的朋友了！"}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <p style={{ fontWeight: 700, margin: "0 0 6px" }}>⭐️ 可用星星：{available}</p>
        <p style={{ fontWeight: 700, margin: "0 0 10px" }}>🎁 送禮物</p>
        <div style={{ display: "flex", gap: 8 }}>
          {GIFT_OPTIONS.map((gift) => (
            <button
              key={gift.id}
              className="btn btn-secondary"
              style={{ flex: 1, fontSize: "0.8rem", lineHeight: 1.5 }}
              disabled={available < gift.cost}
              onClick={() => handleGift(gift.id)}
            >
              {gift.emoji} {gift.label}
              <br />
              {gift.cost}★ → +{gift.hearts}❤️
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <p style={{ fontWeight: 700, margin: "0 0 12px" }}>💬 互動紀錄</p>
        {AFFECTION_STAGE_TITLES.map((title, stage) => {
          const threshold = stage === 0 ? 0 : AFFECTION_MILESTONES[stage - 1];
          const unlocked = hearts >= threshold;
          const text = unlocked ? affectionStageText(stage, speciesId, displayName, typedVariant) : "";
          return (
            <div key={stage} style={{ marginBottom: 12, opacity: unlocked ? 1 : 0.5 }}>
              <p style={{ fontWeight: 700, margin: "0 0 4px", fontSize: "0.9rem" }}>
                {unlocked ? `🔓 ${title}` : `🔒 神秘互動${stage > 0 ? `（❤️${threshold}）` : ""}`}
              </p>
              {unlocked ? (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <button
                    className="btn btn-outline"
                    style={{ fontSize: "0.8rem", padding: "6px 10px", flexShrink: 0 }}
                    onClick={() => speak(text)}
                    aria-label="播放這段互動"
                  >
                    🔊 播放
                  </button>
                  <p style={{ margin: 0, fontSize: "0.95rem", flex: 1 }}>{text}</p>
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--color-text-muted)" }}>
                  多送一些禮物就可以解鎖囉，還不知道會發生什麼事喔！
                </p>
              )}
            </div>
          );
        })}
      </div>

      <Link to="/gacha" className="btn btn-outline btn-block" style={{ marginTop: 16 }}>
        回轉蛋頁
      </Link>
    </div>
  );
}
