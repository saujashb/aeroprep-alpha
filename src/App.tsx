import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProgressProvider } from "./store/ProgressContext";
import { Sidebar } from "./components/Sidebar";
import { ReadinessBar } from "./components/ReadinessBar";
import { DashboardPage } from "./pages/DashboardPage";
import { KnowledgeRadarPage } from "./pages/KnowledgeRadarPage";
import { LearningPathPage, ConceptDetailPage } from "./pages/LearningPathPage";
import { SimulatorLabPage } from "./pages/SimulatorLabPage";
import { ProgressProfilePage } from "./pages/ProgressProfilePage";
import { FlashcardReviewPage } from "./pages/FlashcardReviewPage";

export default function App() {
  return (
    <ProgressProvider>
      <BrowserRouter>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <ReadinessBar />
            <main className="flex-1 overflow-y-auto p-6">
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/radar" element={<KnowledgeRadarPage />} />
                <Route path="/learn" element={<LearningPathPage />} />
                <Route path="/learn/:nodeId" element={<ConceptDetailPage />} />
                <Route path="/lab" element={<SimulatorLabPage />} />
                <Route path="/profile" element={<ProgressProfilePage />} />
                <Route path="/flashcards" element={<FlashcardReviewPage />} />
              </Routes>
            </main>
          </div>
        </div>
      </BrowserRouter>
    </ProgressProvider>
  );
}
