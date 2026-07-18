import { Route, Routes } from "react-router-dom";
import { useFamily } from "./hooks/useFamily";
import { useCharacters } from "./hooks/useCharacters";
import { useSentences } from "./hooks/useSentences";
import { useWeakChars } from "./hooks/useWeakChars";
import { usePrizes } from "./hooks/usePrizes";
import { useAffection } from "./hooks/useAffection";
import { usePlannedChars } from "./hooks/usePlannedChars";
import { FamilySetupPage } from "./pages/FamilySetupPage";
import { HomePage } from "./pages/HomePage";
import { AddCharactersPage } from "./pages/AddCharactersPage";
import { HistoryPage } from "./pages/HistoryPage";
import { TeacherPrepPage } from "./pages/TeacherPrepPage";
import { SentencePracticePage } from "./pages/SentencePracticePage";
import { SentenceManagePage } from "./pages/SentenceManagePage";
import { BulkImportSentencesPage } from "./pages/BulkImportSentencesPage";
import { BatchPracticePage } from "./pages/BatchPracticePage";
import { GachaPage } from "./pages/GachaPage";
import { CreatureDetailPage } from "./pages/CreatureDetailPage";
import { ResetTestDataPage } from "./pages/ResetTestDataPage";
import { NavBar } from "./components/NavBar";
import { saveWeakChar, removeWeakCharEntry } from "./lib/store";

function App() {
  const { familyCode, authReady, authError, previewNewCode, joinFamily, leaveFamily } =
    useFamily();
  const { characters: allCharacters, loading } = useCharacters(familyCode);
  const { sentences: allSentences, loading: sentencesLoading } = useSentences(familyCode);
  // Characters/sentences prepared ahead of time in 老師準備區 are kept out of
  // every normal screen (stats, history, practice, AI "known chars" context)
  // until the parent explicitly releases them — only TeacherPrepPage sees
  // the staged ones.
  const characters = allCharacters.filter((c) => !c.staged);
  const sentences = allSentences.filter((s) => !s.staged);
  const stagedCharacters = allCharacters.filter((c) => c.staged);
  const stagedSentences = allSentences.filter((s) => s.staged);
  const { weakChars } = useWeakChars(familyCode);
  const { prizes } = usePrizes(familyCode);
  const { affection } = useAffection(familyCode);
  const { plannedChars } = usePlannedChars(familyCode);
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
              prizes={prizes}
              affection={affection}
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
          path="/teacher-prep"
          element={
            <TeacherPrepPage
              familyCode={familyCode}
              characters={characters}
              stagedCharacters={stagedCharacters}
              stagedSentences={stagedSentences}
              plannedChars={plannedChars}
            />
          }
        />
        <Route
          path="/sentences/bulk-import"
          element={<BulkImportSentencesPage familyCode={familyCode} characters={characters} />}
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
        <Route
          path="/gacha"
          element={
            <GachaPage
              characters={characters}
              sentences={sentences}
              prizes={prizes}
              affection={affection}
              familyCode={familyCode}
            />
          }
        />
        <Route
          path="/gacha/:speciesId/:variant"
          element={
            <CreatureDetailPage
              characters={characters}
              sentences={sentences}
              prizes={prizes}
              affection={affection}
              familyCode={familyCode}
            />
          }
        />
        {/* Intentionally not linked from any nav item or button — see ResetTestDataPage for why. */}
        <Route
          path="/reset-test-data"
          element={
            <ResetTestDataPage
              characters={characters}
              sentences={sentences}
              prizes={prizes}
              familyCode={familyCode}
            />
          }
        />
      </Routes>
      <NavBar />
    </div>
  );
}

export default App;
