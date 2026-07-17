import { Route, Routes } from "react-router-dom";
import { useFamily } from "./hooks/useFamily";
import { useCharacters } from "./hooks/useCharacters";
import { useSentences } from "./hooks/useSentences";
import { useWeakChars } from "./hooks/useWeakChars";
import { FamilySetupPage } from "./pages/FamilySetupPage";
import { HomePage } from "./pages/HomePage";
import { AddCharactersPage } from "./pages/AddCharactersPage";
import { HistoryPage } from "./pages/HistoryPage";
import { SentencePracticePage } from "./pages/SentencePracticePage";
import { SentenceManagePage } from "./pages/SentenceManagePage";
import { BatchPracticePage } from "./pages/BatchPracticePage";
import { NavBar } from "./components/NavBar";
import { saveWeakChar, removeWeakCharEntry } from "./lib/store";

function App() {
  const { familyCode, authReady, authError, previewNewCode, joinFamily, leaveFamily } =
    useFamily();
  const { characters, loading } = useCharacters(familyCode);
  const { sentences, loading: sentencesLoading } = useSentences(familyCode);
  const { weakChars } = useWeakChars(familyCode);
  const weakCharSet = new Set(weakChars.map((w) => w.hanzi));

  function toggleWeakChar(char: string) {
    if (!familyCode) return;
    const existing = weakChars.find((w) => w.hanzi === char);
    if (existing) {
      removeWeakCharEntry(familyCode, existing.id);
    } else {
      saveWeakChar(familyCode, char);
    }
  }

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
        <Route
          path="/add"
          element={
            <AddCharactersPage
              familyCode={familyCode}
              characters={characters}
              sentences={sentences}
              weakChars={weakCharSet}
              onToggleWeakChar={toggleWeakChar}
            />
          }
        />
        <Route
          path="/history"
          element={
            <HistoryPage
              characters={characters}
              sentences={sentences}
              weakChars={weakChars}
              familyCode={familyCode}
            />
          }
        />
        <Route
          path="/sentences"
          element={
            <SentencePracticePage
              characters={characters}
              sentences={sentences}
              sentencesLoading={sentencesLoading}
              familyCode={familyCode}
              weakChars={weakCharSet}
              onToggleWeakChar={toggleWeakChar}
            />
          }
        />
        <Route
          path="/sentences/manage"
          element={<SentenceManagePage sentences={sentences} familyCode={familyCode} />}
        />
        <Route
          path="/sentences/batch"
          element={
            <BatchPracticePage
              sentences={sentences}
              familyCode={familyCode}
              weakChars={weakCharSet}
              onToggleWeakChar={toggleWeakChar}
            />
          }
        />
      </Routes>
      <NavBar />
    </div>
  );
}

export default App;
