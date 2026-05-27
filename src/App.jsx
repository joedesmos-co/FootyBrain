import { lazy, Suspense, useEffect } from 'react';
import { Link, BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import Home from './components/Home';
import NotFoundPage from './components/NotFoundPage';
import PageFallback from './components/PageFallback';
import PrivacyPage from './components/PrivacyPage';
import Seo from './components/Seo';
import { DATASET_META } from './data/datasetMeta';

const BrowseDatabase = lazy(() => import('./components/BrowseDatabase'));
const PlayerProfile = lazy(() => import('./components/PlayerProfile'));
const TeamProfile = lazy(() => import('./components/TeamProfile'));
const LeagueProfile = lazy(() => import('./components/LeagueProfile'));
const TeamLearning = lazy(() => import('./components/TeamLearning'));
const QuizMode = lazy(() => import('./components/QuizMode'));
const SavedPage = lazy(() => import('./components/SavedPage'));
const ProfilePage = lazy(() => import('./components/ProfilePage'));
const DailyChallenge = lazy(() => import('./components/DailyChallenge'));
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
  return (
    <Suspense fallback={<PageFallback label="Loading quiz…" />}>
      <QuizMode key={search} />
    </Suspense>
  );
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
      <ErrorBoundary>
        <ScrollToTop />
        <Seo />
        <div className="app">
          <Navbar />
          <main className="app__main" id="main-content">
            <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/onboarding" element={withPageSuspense(OnboardingPage, 'Loading…')} />
            <Route
              path="/browse"
              element={withPageSuspense(BrowseDatabase, 'Loading database…')}
            />
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
            <Route
              path="/player/:playerId"
              element={withPageSuspense(PlayerProfile, 'Loading player…')}
            />
            <Route
              path="/team/:teamId"
              element={withPageSuspense(TeamProfile, 'Loading club…')}
            />
            <Route
              path="/league/:leagueId"
              element={withPageSuspense(LeagueProfile, 'Loading league…')}
            />
            <Route
              path="/teams"
              element={withPageSuspense(TeamLearning, 'Loading teams…')}
            />
            <Route path="/quiz" element={<QuizRoute />} />
            <Route path="/saved" element={withPageSuspense(SavedPage, 'Loading saved…')} />
            <Route
              path="/daily"
              element={withPageSuspense(DailyChallenge, 'Loading daily challenge…')}
            />
            <Route path="/profile" element={withPageSuspense(ProfilePage, 'Loading profile…')} />
            <Route path="/privacy" element={<PrivacyPage />} />
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
            {!import.meta.env.PROD ? (
              <>
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
                  element={withPageSuspense(
                    DevNationalTeamsPage,
                    'Loading national teams preview…',
                  )}
                />
              </>
            ) : null}
            <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
          <footer className="app__footer" aria-label="Footer">
            <p>FootyBrain · Learn the game. Know the players.</p>
            <p className="app__footer__meta">
              Updated {DATASET_META.dataAsOf} · {DATASET_META.playerCount} players ·{' '}
              {DATASET_META.quizEligibleCount} with quiz mode
            </p>
            <p className="app__footer__feedback">
              Have feedback, found a bug, or want to suggest a feature? Email us at{' '}
              <a href="mailto:joedesmos.co@gmail.com">joedesmos.co@gmail.com</a>
            </p>
            <p className="app__footer__privacy">
              No accounts. Progress, favorites, and preferences stay in your browser only — not
              sold or synced to a server. <Link to="/privacy">Privacy Policy</Link>
            </p>
          </footer>
        </div>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
