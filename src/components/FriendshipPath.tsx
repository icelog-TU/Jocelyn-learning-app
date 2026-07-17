import { Fragment } from "react";
import "./FriendshipPath.css";
import { AFFECTION_STAGES, currentStageIndex } from "../lib/affectionContent";
import { speakAsRole } from "../lib/voiceProvider";
import type { CreatureVariant } from "../types";

interface Props {
  hearts: number;
  variant: CreatureVariant;
}

/** A 5-stage "friendship growth path" for affection, replacing a bare heart
 * count with something a child who can't read numbers yet can still follow:
 * locked (grey) vs unlocked (colored) nodes, the current stage pulsing, and
 * a plain-language "X more hearts unlocks Y" hint below, which can also be
 * played out loud since the target audience can't necessarily read it yet. */
export function FriendshipPath({ hearts, variant }: Props) {
  const currentIdx = currentStageIndex(hearts);
  const next = AFFECTION_STAGES[currentIdx + 1];
  const hintText = next
    ? `再得到 ${next.threshold - hearts} 顆心，就可以「${next.title}」！`
    : "已經是最要好的朋友了！";

  return (
    <div>
      <div className="friendship-path">
        {AFFECTION_STAGES.map((stage, i) => {
          const unlocked = hearts >= stage.threshold;
          const isCurrent = i === currentIdx;
          return (
            <Fragment key={stage.title}>
              {i > 0 && (
                <div className={`friendship-line${hearts >= stage.threshold ? " filled" : ""}`} />
              )}
              <button
                className="friendship-node-wrap"
                onClick={() => speakAsRole(stage.title, variant)}
                aria-label={`播放「${stage.title}」`}
              >
                <div className={`friendship-node${unlocked ? " unlocked" : ""}${isCurrent ? " current" : ""}`}>
                  {unlocked ? stage.icon : "🔒"}
                </div>
                <div className="friendship-node-label">{stage.title}</div>
              </button>
            </Fragment>
          );
        })}
      </div>
      <button
        className="friendship-next-hint"
        onClick={() => speakAsRole(hintText, variant)}
        aria-label="播放提示"
      >
        🔊 {hintText}
        {!next && " 💖"}
      </button>
    </div>
  );
}
