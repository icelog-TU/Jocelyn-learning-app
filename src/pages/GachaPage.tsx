import { useState } from "react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import type { AffectionDoc, CharacterDoc, CollectedPrizeDoc, CreatureVariant, SentenceDoc } from "../types";
import { computeTotalStars } from "../lib/sentencePractice";
import { savePrize } from "../lib/store";
import { playInsufficientSound, playStarSound } from "../lib/sound";
import { speak } from "../lib/speech";
import { toChineseCount } from "../lib/chineseNumerals";
import { StarBurst } from "../components/StarBurst";
import "../components/GachaCapsule.css";
import {
  CREATURE_SPECIES,
  CREATURE_VARIANTS,
  GACHA_COST,
  VARIANT_BADGES,
  VARIANT_LABELS,
  allPrizeKeys,
  computeAvailableStars,
  drawRandomPrize,
  prizeKey,
  speciesById,
} from "../lib/gachaCatalog";

function creatureFullName(speciesId: string, variant: CreatureVariant): string {
  const species = speciesById(speciesId);
  return `${species?.name ?? ""}${VARIANT_LABELS[variant]}`;
}

/** Reset styles so a <button> can stand in for plain tappable text/headings
 * without looking like a button. */
const speakableButtonStyle: CSSProperties = {
  background: "none",
  border: "none",
  padding: 0,
  margin: 0,
  font: "inherit",
  color: "inherit",
  textAlign: "left",
  cursor: "pointer",
  display: "block",
  width: "100%",
};

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
  const available = computeAvailableStars(totalStars, prizes.length, affection);
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
    if (drawing) return;
    if (available < GACHA_COST) {
      playInsufficientSound();
      speak("可用星星不夠，要多練習賺星星，才能轉蛋喔。");
      return;
    }
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
      speak(`恭喜你，轉到${creatureFullName(prize.speciesId, prize.variant)}了！`);
    }, 900);
  }

  return (
    <div className="screen">
      <h1 className="page-title" style={{ margin: "4px 0 4px" }}>
        <button
          type="button"
          style={{ ...speakableButtonStyle, fontSize: "inherit", fontWeight: "inherit" }}
          onClick={() => speak("星星轉蛋")}
        >
          🎁 星星轉蛋
        </button>
      </h1>
      <button
        type="button"
        style={{
          ...speakableButtonStyle,
          color: "var(--color-text-muted)",
          fontSize: "0.9rem",
          marginBottom: 16,
        }}
        onClick={() => speak("累積練習賺到的星星，就可以轉蛋，解鎖怪獸一家人！")}
      >
        用練習賺到的星星轉蛋，收集怪獸一家人！
      </button>

      <div className="card" style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <button
          type="button"
          style={{ ...speakableButtonStyle, flex: 1, textAlign: "center" }}
          onClick={() => speak(`你現在有 ${toChineseCount(available)} 顆可用的星星。`)}
        >
          <div style={{ fontSize: "1.6rem", fontWeight: 800 }}>⭐️ {available}</div>
          <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>可用星星</div>
        </button>
        <button
          type="button"
          style={{ ...speakableButtonStyle, flex: 1, textAlign: "center" }}
          onClick={() =>
            speak(`你已經蒐集了 ${ownedKeyCount} 種，一共有 ${totalKeyCount} 種怪獸。`)
          }
        >
          <div style={{ fontSize: "1.6rem", fontWeight: 800 }}>
            {ownedKeyCount} / {totalKeyCount}
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>收集進度</div>
        </button>
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
          <button
            type="button"
            className={`gacha-capsule${drawing ? " shaking" : ""}`}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
            onClick={() => speak(`轉蛋一次，要花 ${toChineseCount(GACHA_COST)} 顆星星。`)}
            aria-label="轉蛋一次要花幾顆星星"
          >
            🎁
          </button>
        )}

        <button
          className="btn btn-primary"
          style={{ width: "100%", opacity: canDraw || drawing ? 1 : 0.6 }}
          disabled={drawing}
          aria-disabled={!canDraw}
          onClick={handleDraw}
        >
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
      <button
        type="button"
        style={{ ...speakableButtonStyle, fontWeight: 700, marginBottom: 4 }}
        onClick={() => speak("我的收藏")}
      >
        🧸 我的收藏
      </button>
      <button
        type="button"
        style={{
          ...speakableButtonStyle,
          color: "var(--color-text-muted)",
          fontSize: "0.8rem",
          marginBottom: 12,
        }}
        onClick={() => speak("點一下已經轉到的怪獸，可以送禮物、養好感度！")}
      >
        點一下已經轉到的怪獸，可以送禮物、養好感度！
      </button>
      {CREATURE_SPECIES.map((species) => {
        const ownedForSpecies = CREATURE_VARIANTS.filter((v) =>
          ownedCounts.has(prizeKey(species.id, v)),
        ).length;
        return (
          <div key={species.id} style={{ marginBottom: 16 }}>
            <button
              type="button"
              style={{ ...speakableButtonStyle, display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}
              onClick={() => speak(species.name)}
            >
              <span style={{ fontSize: "1.3rem" }}>{species.emoji}</span>
              <strong style={{ fontSize: "0.95rem" }}>{species.name}</strong>
              <span style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>
                {ownedForSpecies} / {CREATURE_VARIANTS.length}
              </span>
            </button>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
              {CREATURE_VARIANTS.map((variant) => {
                const key = prizeKey(species.id, variant);
                const count = ownedCounts.get(key) ?? 0;
                const owned = count > 0;
                const hearts = heartsByKey.get(key) ?? 0;
                const tileInner = (
                  <>
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
                  </>
                );
                const tileStyle: CSSProperties = {
                  textAlign: "center",
                  borderRadius: 10,
                  padding: "6px 2px",
                  background: owned ? species.color : "#f1ede6",
                  position: "relative",
                  border: "none",
                  width: "100%",
                  cursor: "pointer",
                  font: "inherit",
                };
                return owned ? (
                  <Link
                    key={variant}
                    to={`/gacha/${species.id}/${variant}`}
                    style={{ textDecoration: "none", color: "inherit" }}
                    onClick={() => speak(`${species.name}${VARIANT_LABELS[variant]}`)}
                  >
                    <div style={tileStyle}>{tileInner}</div>
                  </Link>
                ) : (
                  <button
                    key={variant}
                    type="button"
                    style={tileStyle}
                    onClick={() => speak("你還沒蒐集到這個動物")}
                    aria-label="還沒蒐集到這個動物"
                  >
                    {tileInner}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
