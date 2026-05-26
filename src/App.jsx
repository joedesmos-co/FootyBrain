import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import { DATASET_META } from './data/datasetMeta';
import BrowseDatabase from './components/BrowseDatabase';
import PlayerProfile from './components/PlayerProfile';
import TeamProfile from './components/TeamProfile';
import LeagueProfile from './components/LeagueProfile';
import TeamLearning from './components/TeamLearning';
import QuizMode from './components/QuizMode';
import SavedPage from './components/SavedPage';
import ProgressPage from './components/ProgressPage';
import DailyChallenge from './components/DailyChallenge';

const NationalTeamsPage = lazy(() => import('./components/NationalTeamsPage'));
const NationalTeamProfile = lazy(() => import('./components/NationalTeamProfile'));
const DevExpandedDataPage = lazy(() => import('./components/DevExpandedDataPage'));
const DevNationalTeamsPage = lazy(() => import('./components/DevNationalTeamsPage'));

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

function withPageSuspense(Component, label) {
  return (
    <Suspense
      fallback={
        <p className="dev-expanded__status" style={{ padding: '1.5rem' }}>
          {label}
        </p>
      }
    >
      <Component />
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="app">
        <Navbar />
        <main className="app__main" id="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/browse" element={<BrowseDatabase />} />
            <Route path="/player/:playerId" element={<PlayerProfile />} />
            <Route path="/team/:teamId" element={<TeamProfile />} />
            <Route path="/league/:leagueId" element={<LeagueProfile />} />
            <Route path="/teams" element={<TeamLearning />} />
            <Route path="/quiz" element={<QuizRoute />} />
            <Route path="/saved" element={<SavedPage />} />
            <Route path="/daily" element={<DailyChallenge />} />
            <Route path="/profile" element={<ProgressPage />} />
            <Route
              path="/national-teams"
              element={withPageSuspense(NationalTeamsPage, 'Loading national teams…')}
            />
            <Route
              path="/national-team/:teamId"
              element={withPageSuspense(NationalTeamProfile, 'Loading national team…')}
            />
            <Route
              path="/dev/expanded-data"
              element={
                <Suspense
                  fallback={
                    <p className="dev-expanded__status" style={{ padding: '1.5rem' }}>
                      Loading dev preview…
                    </p>
                  }
                >
                  <DevExpandedDataPage />
                </Suspense>
              }
            />
            <Route
              path="/dev/national-teams"
              element={withPageSuspense(DevNationalTeamsPage, 'Loading national teams preview…')}
            />
          </Routes>
        </main>
        <footer className="app__footer">
          <p>FootyBrain · Learn the game. Know the players.</p>
          <p className="app__footer__meta">
            Public beta · Men&apos;s football · Data snapshot {DATASET_META.dataAsOf}
          </p>
          <p className="app__footer__privacy">
            No accounts. Progress, favorites, and preferences are stored in your browser only —
            not sold or synced to a server.
          </p>
        </footer>
      </div>
    </BrowserRouter>
  );
}
