import { useState } from "react";
import { Link } from "react-router-dom";
import type { AffectionDoc, CharacterDoc, CollectedPrizeDoc, CreatureVariant, SentenceDoc } from "../types";
import { computeTotalStars } from "../lib/sentencePractice";
import { savePrize } from "../lib/store";
import { playStarSound } from "../lib/sound";
import { StarBurst } from "../components/StarBurst";
import "../components/GachaCapsule.css";
import {
  CREATURE_SPECIES,
  CREATURE_VARIANTS,
  GACHA_COST,
  VARIANT_BADGES,
  VARIANT_LABELS,
  allPrizeKeys,
  drawRandomPrize,
  prizeKey,
  speciesById,
} from "../lib/gachaCatalog";

interface Props {
  characters: CharacterDoc[];
  sentences: SentenceDoc[];
  prizes: CollectedPrizeDoc[];
  affection: AffectionDoc[];
  familyCode: string;
}

export function GachaPage({ characters, sentences, prizes, affection, familyCode }: Props) {
  const [drawing, setDrawing] = useState(false);
  const [reveal, setReveal] = useState<{ speciesId: string; variant: CreatureVariant; isNew: boolean } | null>(
    null,
  );
  const [burstKey, setBurstKey] = useState(0);

  const totalStars = computeTotalStars(characters, sentences);
  const spentOnDraws = prizes.length * GACHA_COST;
  const spentOnGifts = affection.reduce((sum, a) => sum + a.starsSpent, 0);
  const available = totalStars - spentOnDraws - spentOnGifts;
  const canDraw = available >= GACHA_COST && !drawing;

  const heartsByKey = new Map<string, number>();
  for (const a of affection) {
    heartsByKey.set(a.id, a.hearts);
  }

  const ownedCounts = new Map<string, number>();
  for (const p of prizes) {
    const key = prizeKey(p.speciesId, p.variant);
    ownedCounts.set(key, (ownedCounts.get(key) ?? 0) + 1);
  }
  const ownedKeyCount = [...ownedCounts.keys()].length;
  const totalKeyCount = allPrizeKeys().length;

  async function handleDraw() {
    if (!canDraw) return;
    setReveal(null);
    setDrawing(true);

    const prize = drawRandomPrize();
    const isNew = !ownedCounts.has(prizeKey(prize.speciesId, prize.variant));

    window.setTimeout(async () => {
      await savePrize(familyCode, prize.speciesId, prize.variant);
      setDrawing(false);
      setReveal({ ...prize, isNew });
      setBurstKey((k) => k + 1);
      playStarSound();
    }, 900);
  }

  return (
    <div className="screen">
      <h1 className="page-title">🎁 星星轉蛋</h1>
      <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginTop: -8 }}>
        用練習賺到的星星轉蛋，收集怪獸一家人！
      </p>

      <div className="card" style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: "1.6rem", fontWeight: 800 }}>⭐️ {available}</div>
          <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>可用星星</div>
        </div>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: "1.6rem", fontWeight: 800 }}>
            {ownedKeyCount} / {totalKeyCount}
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>收集進度</div>
        </div>
      </div>

      <div
        className="card"
        style={{
          marginBottom: 16,
          textAlign: "center",
          position: "relative",
          minHeight: 220,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
        }}
      >
        {reveal ? (
          <RevealCard reveal={reveal} burstKey={burstKey} />
        ) : (
          <span className={`gacha-capsule${drawing ? " shaking" : ""}`}>🎁</span>
        )}

        <button className="btn btn-primary" style={{ width: "100%" }} disabled={!canDraw} onClick={handleDraw}>
          {drawing ? "轉蛋中…" : `轉蛋一次（${GACHA_COST} 顆星）`}
        </button>
        {!drawing && available < GACHA_COST && (
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", margin: 0 }}>
            星星不夠了，再多練習幾句就可以轉蛋囉！
          </p>
        )}
      </div>

      <CollectionGrid ownedCounts={ownedCounts} heartsByKey={heartsByKey} />
    </div>
  );
}

function RevealCard({
  reveal,
  burstKey,
}: {
  reveal: { speciesId: string; variant: CreatureVariant; isNew: boolean };
  burstKey: number;
}) {
  const species = speciesById(reveal.speciesId);
  if (!species) return null;
  return (
    <div className="gacha-reveal-card" style={{ position: "relative" }}>
      <StarBurst burstKey={burstKey} />
      {reveal.isNew && (
        <div
          className="gacha-new-badge"
          style={{
            position: "absolute",
            top: -10,
            right: -10,
            background: "var(--color-primary)",
            color: "#fff",
            borderRadius: 999,
            padding: "2px 10px",
            fontSize: "0.75rem",
            fontWeight: 700,
          }}
        >
          NEW!
        </div>
      )}
      <div
        style={{
          background: species.color,
          borderRadius: 20,
          padding: "18px 28px",
          display: "inline-flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
        }}
      >
        <div style={{ fontSize: "3.2rem" }}>
          {species.emoji}
          {VARIANT_BADGES[reveal.variant]}
        </div>
        <div style={{ fontSize: "1.2rem", fontWeight: 700 }}>
          {species.name}
          {VARIANT_LABELS[reveal.variant]}
        </div>
      </div>
    </div>
  );
}

function CollectionGrid({
  ownedCounts,
  heartsByKey,
}: {
  ownedCounts: Map<string, number>;
  heartsByKey: Map<string, number>;
}) {
  return (
    <div className="card">
      <p style={{ fontWeight: 700, margin: "0 0 4px" }}>🧸 我的收藏</p>
      <p style={{ color: "var(--color-text-muted)", fontSize: "0.8rem", marginTop: 0, marginBottom: 12 }}>
        點一下已經轉到的怪獸，可以送禮物、養好感度！
      </p>
      {CREATURE_SPECIES.map((species) => {
        const ownedForSpecies = CREATURE_VARIANTS.filter((v) =>
          ownedCounts.has(prizeKey(species.id, v)),
        ).length;
        return (
          <div key={species.id} style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: "1.3rem" }}>{species.emoji}</span>
              <strong style={{ fontSize: "0.95rem" }}>{species.name}</strong>
              <span style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>
                {ownedForSpecies} / {CREATURE_VARIANTS.length}
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
              {CREATURE_VARIANTS.map((variant) => {
                const key = prizeKey(species.id, variant);
                const count = ownedCounts.get(key) ?? 0;
                const owned = count > 0;
                const hearts = heartsByKey.get(key) ?? 0;
                const tile = (
                  <div
                    style={{
                      textAlign: "center",
                      borderRadius: 10,
                      padding: "6px 2px",
                      background: owned ? species.color : "#f1ede6",
                      position: "relative",
                    }}
                  >
                    {owned && count > 1 && (
                      <span
                        style={{
                          position: "absolute",
                          top: 1,
                          right: 3,
                          fontSize: "0.6rem",
                          fontWeight: 700,
                          color: "var(--color-text-muted)",
                        }}
                      >
                        x{count}
                      </span>
                    )}
                    <div style={{ fontSize: "1.3rem", opacity: owned ? 1 : 0.35 }}>
                      {owned ? species.emoji : "❔"}
                    </div>
                    <div style={{ fontSize: "0.65rem", color: "var(--color-text-muted)" }}>
                      {VARIANT_LABELS[variant]}
                    </div>
                    {owned && (
                      <div style={{ fontSize: "0.65rem", color: "var(--color-primary-dark)", fontWeight: 700 }}>
                        ❤️{hearts}
                      </div>
                    )}
                  </div>
                );
                return owned ? (
                  <Link key={variant} to={`/gacha/${species.id}/${variant}`} style={{ textDecoration: "none", color: "inherit" }}>
                    {tile}
                  </Link>
                ) : (
                  <div key={variant}>{tile}</div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
