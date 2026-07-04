import type { CharacterDoc } from "../types";

interface Props {
  character: CharacterDoc;
}

function speak(hanzi: string) {
  if (!("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(hanzi);
  utterance.lang = "zh-TW";
  utterance.rate = 0.85;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export function Flashcard({ character }: Props) {
  return (
    <div
      className="card"
      style={{
        textAlign: "center",
        padding: "40px 20px",
        position: "relative",
      }}
    >
      <div style={{ fontSize: "1.4rem", color: "var(--color-secondary)", fontWeight: 700 }}>
        {character.zhuyin}
      </div>
      <div
        style={{
          fontSize: "7rem",
          lineHeight: 1.1,
          fontWeight: 700,
          margin: "8px 0 20px",
        }}
      >
        {character.hanzi}
      </div>
      <button
        className="btn btn-outline"
        onClick={() => speak(character.hanzi)}
        aria-label="播放發音"
      >
        🔊 聽發音
      </button>
    </div>
  );
}
