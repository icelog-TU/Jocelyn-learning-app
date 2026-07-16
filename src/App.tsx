import { Route, Routes } from "react-router-dom";
import { useFamily } from "./hooks/useFamily";
import { useCharacters } from "./hooks/useCharacters";
import { useSentenceStats } from "./hooks/useSentenceStats";
import { FamilySetupPage } from "./pages/FamilySetupPage";
import { HomePage } from "./pages/HomePage";
import { AddCharactersPage } from "./pages/AddCharactersPage";
import { ReviewPage } from "./pages/ReviewPage";
import { HistoryPage } from "./pages/HistoryPage";
import { SentencePracticePage } from "./pages/SentencePracticePage";
import { NavBar } from "./components/NavBar";

function App() {
  const { familyCode, authReady, authError, previewNewCode, joinFamily, leaveFamily } =
    useFamily();
  const { characters, loading } = useCharacters(familyCode);
  const sentenceStats = useSentenceStats(familyCode);

  if (!familyCode) {
    return (
      <div className="app-shell">
        <FamilySetupPage onPreviewNewCode={previewNewCode} onJoin={joinFamily} />
      </div>
    );
  }

  if (authError) {
    return (
      <div className="app-shell">
        <div className="screen">
          <h1 className="page-title">連線發生問題</h1>
          <div className="card">
            <p>{authError}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!authReady) {
    return (
      <div className="app-shell">
        <div className="screen">
          <p style={{ textAlign: "center", marginTop: 80 }}>載入中…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              characters={characters}
              familyCode={familyCode}
              loading={loading}
              sentenceStars={sentenceStats.totalStars}
              onChangeFamilyCode={leaveFamily}
            />
          }
        />
        <Route path="/add" element={<AddCharactersPage familyCode={familyCode} />} />
        <Route
          path="/review"
          element={<ReviewPage characters={characters} familyCode={familyCode} />}
        />
        <Route path="/history" element={<HistoryPage characters={characters} />} />
        <Route
          path="/sentences"
          element={<SentencePracticePage characters={characters} familyCode={familyCode} />}
        />
      </Routes>
      <NavBar />
    </div>
  );
}

export default App;
