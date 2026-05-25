import { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import BrowseDatabase from './components/BrowseDatabase';
import PlayerProfile from './components/PlayerProfile';
import TeamProfile from './components/TeamProfile';
import TeamLearning from './components/TeamLearning';
import QuizMode from './components/QuizMode';
import SavedPage from './components/SavedPage';

function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo({ left: 0, top: 0 });
  }, [pathname, search]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="app">
        <Navbar />
        <main className="app__main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/browse" element={<BrowseDatabase />} />
            <Route path="/player/:playerId" element={<PlayerProfile />} />
            <Route path="/team/:teamId" element={<TeamProfile />} />
            <Route path="/teams" element={<TeamLearning />} />
            <Route path="/quiz" element={<QuizMode />} />
            <Route path="/saved" element={<SavedPage />} />
          </Routes>
        </main>
        <footer className="app__footer">
          <p>FootyBrain MVP — local sample data. API integration coming soon.</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}
