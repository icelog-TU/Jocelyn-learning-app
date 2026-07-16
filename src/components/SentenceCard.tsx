import { zhuyinForSentence } from "../lib/zhuyin";

interface Props {
  sentence: string;
}

function speak(text: string) {
  if (!("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-TW";
  utterance.rate = 0.8;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export function SentenceCard({ sentence }: Props) {
  const chars = zhuyinForSentence(sentence);

  return (
    <div className="card" style={{ textAlign: "center", padding: "32px 20px" }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          rowGap: 16,
          columnGap: 4,
          marginBottom: 20,
        }}
      >
        {chars.map((c, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1rem", color: "var(--color-secondary)", fontWeight: 700 }}>
              {c.zhuyin}
            </div>
            <div style={{ fontSize: "2.6rem", fontWeight: 700, lineHeight: 1.1 }}>{c.char}</div>
          </div>
        ))}
      </div>
      <button className="btn btn-outline" onClick={() => speak(sentence)} aria-label="播放整句發音">
        🔊 聽整句
      </button>
    </div>
  );
}
