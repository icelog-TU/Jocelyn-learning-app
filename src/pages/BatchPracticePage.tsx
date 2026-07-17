import { Link, useLocation } from "react-router-dom";
import type { SentenceDoc } from "../types";
import { SentencePracticeSession } from "../components/SentencePracticeSession";

interface Props {
  sentences: SentenceDoc[];
  familyCode: string;
  weakChars: Set<string>;
  onToggleWeakChar: (char: string) => void;
}

export function BatchPracticePage({ sentences, familyCode, weakChars, onToggleWeakChar }: Props) {
  const location = useLocation();
  const ids = (location.state as { ids?: string[] } | null)?.ids ?? [];
  const byId = new Map(sentences.map((s) => [s.id, s]));
  const session = ids.map((id) => byId.get(id)).filter((s): s is SentenceDoc => Boolean(s));

  if (session.length === 0) {
    return (
      <div className="screen">
        <h1 className="page-title">複習句子</h1>
        <div className="empty-state card">
          <p>找不到這批句子了，可能已經被刪除。</p>
          <Link to="/history" className="btn btn-primary" style={{ marginTop: 12 }}>
            回紀錄
          </Link>
        </div>
      </div>
    );
  }

  const title = session[0].sourceChars[0] ? `複習「${session[0].sourceChars[0]}」的句子` : "複習句子";

  return (
    <div className="screen">
      <h1 className="page-title">{title}</h1>
      <SentencePracticeSession
        key={ids.join(",")}
        session={session}
        familyCode={familyCode}
        weakChars={weakChars}
        onToggleWeakChar={onToggleWeakChar}
        completionActions={
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <Link to="/history" className="btn btn-outline" style={{ flex: 1 }}>
              回紀錄
            </Link>
            <Link to="/" className="btn btn-primary" style={{ flex: 1 }}>
              回首頁
            </Link>
          </div>
        }
      />
    </div>
  );
}
