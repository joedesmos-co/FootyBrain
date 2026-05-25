import { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import BrowseDatabase from './components/BrowseDatabase';
import PlayerProfile from './components/PlayerProfile';
import TeamProfile from './components/TeamProfile';
import LeagueProfile from './components/LeagueProfile';
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

function QuizRoute() {
  const { search } = useLocation();
  return <QuizMode key={search} />;
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
            <Route path="/league/:leagueId" element={<LeagueProfile />} />
            <Route path="/teams" element={<TeamLearning />} />
            <Route path="/quiz" element={<QuizRoute />} />
            <Route path="/saved" element={<SavedPage />} />
          </Routes>
        </main>
        <footer className="app__footer">
          <p>FootyBrain · Learn the game. Know the players. Become a real fan.</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}
