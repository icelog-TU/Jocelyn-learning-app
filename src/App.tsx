import { Route, Routes } from "react-router-dom";
import { useFamily } from "./hooks/useFamily";
import { useCharacters } from "./hooks/useCharacters";
import { useSentences } from "./hooks/useSentences";
import { FamilySetupPage } from "./pages/FamilySetupPage";
import { HomePage } from "./pages/HomePage";
import { AddCharactersPage } from "./pages/AddCharactersPage";
import { ReviewPage } from "./pages/ReviewPage";
import { HistoryPage } from "./pages/HistoryPage";
import { SentencePracticePage } from "./pages/SentencePracticePage";
import { SentenceManagePage } from "./pages/SentenceManagePage";
import { NavBar } from "./components/NavBar";

function App() {
  const { familyCode, authReady, authError, previewNewCode, joinFamily, leaveFamily } =
    useFamily();
  const { characters, loading } = useCharacters(familyCode);
  const { sentences, loading: sentencesLoading } = useSentences(familyCode);

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
              sentences={sentences}
              familyCode={familyCode}
              loading={loading}
              onChangeFamilyCode={leaveFamily}
            />
          }
        />
        <Route path="/add" element={<AddCharactersPage familyCode={familyCode} />} />
        <Route
          path="/review"
          element={<ReviewPage characters={characters} familyCode={familyCode} />}
        />
        <Route
          path="/history"
          element={<HistoryPage characters={characters} sentences={sentences} />}
        />
        <Route
          path="/sentences"
          element={
            <SentencePracticePage
              characters={characters}
              sentences={sentences}
              sentencesLoading={sentencesLoading}
              familyCode={familyCode}
            />
          }
        />
        <Route
          path="/sentences/manage"
          element={<SentenceManagePage sentences={sentences} familyCode={familyCode} />}
        />
      </Routes>
      <NavBar />
    </div>
  );
}

export default App;
