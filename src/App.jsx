import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import NotFoundPage from './components/NotFoundPage';
import PageFallback from './components/PageFallback';
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

const ComparePage = lazy(() => import('./components/ComparePage'));
const CollectionsPage = lazy(() => import('./components/CollectionsPage'));
const CollectionDetailPage = lazy(() => import('./components/CollectionDetailPage'));
const LearningPathsPage = lazy(() => import('./components/LearningPathsPage'));
const LearningPathDetailPage = lazy(() => import('./components/LearningPathDetailPage'));
const OnboardingPage = lazy(() => import('./components/OnboardingPage'));
const NationalTeamsPage = lazy(() => import('./components/NationalTeamsPage'));
const NationalTeamProfile = lazy(() => import('./components/NationalTeamProfile'));
const WorldCupHubPage = lazy(() => import('./components/WorldCupHubPage'));
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
    <Suspense fallback={<PageFallback label={label} />}>
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
            <Route path="/onboarding" element={withPageSuspense(OnboardingPage, 'Loading…')} />
            <Route path="/browse" element={<BrowseDatabase />} />
            <Route path="/compare" element={withPageSuspense(ComparePage, 'Loading compare…')} />
            <Route path="/compare-clubs" element={withPageSuspense(ComparePage, 'Loading compare…')} />
            <Route
              path="/collections"
              element={withPageSuspense(CollectionsPage, 'Loading collections…')}
            />
            <Route
              path="/collections/:collectionId"
              element={withPageSuspense(CollectionDetailPage, 'Loading collection…')}
            />
            <Route
              path="/learning-paths"
              element={withPageSuspense(LearningPathsPage, 'Loading paths…')}
            />
            <Route
              path="/learning-paths/:pathId"
              element={withPageSuspense(LearningPathDetailPage, 'Loading path…')}
            />
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
              path="/world-cup"
              element={withPageSuspense(WorldCupHubPage, 'Loading World Cup hub…')}
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
            <Route path="*" element={<NotFoundPage />} />
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
