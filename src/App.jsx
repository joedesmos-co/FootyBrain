import { lazy, Suspense, useEffect } from 'react';
import { Link, BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import Home from './components/Home';
import NotFoundPage from './components/NotFoundPage';
import PageFallback from './components/PageFallback';
import PrivacyPage from './components/PrivacyPage';
import Seo from './components/Seo';
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
const AboutPage = lazy(() => import('./components/AboutPage'));
const EditorialPolicyPage = lazy(() => import('./components/EditorialPolicyPage'));
const DevExpandedDataPage = lazy(() => import('./components/DevExpandedDataPage'));
const DevNationalTeamsPage = lazy(() => import('./components/DevNationalTeamsPage'));
const SeoHubsIndex = lazy(() =>
  import('./components/SeoHubs').then((m) => ({ default: m.SeoHubsIndex })),
);
const SeoQuizzesHub = lazy(() =>
  import('./components/SeoHubs').then((m) => ({ default: m.SeoQuizzesHub })),
);
const SeoLeagueQuizHub = lazy(() =>
  import('./components/SeoHubs').then((m) => ({ default: m.SeoLeagueQuizHub })),
);
const SeoTeamQuizHub = lazy(() =>
  import('./components/SeoHubs').then((m) => ({ default: m.SeoTeamQuizHub })),
);
const SeoPlayersByNationalityHub = lazy(() =>
  import('./components/SeoHubs').then((m) => ({ default: m.SeoPlayersByNationalityHub })),
);
const SeoNationalityPlayersHub = lazy(() =>
  import('./components/SeoHubs').then((m) => ({ default: m.SeoNationalityPlayersHub })),
);
const SeoBestYoungFootballersHub = lazy(() =>
  import('./components/SeoHubs').then((m) => ({ default: m.SeoBestYoungFootballersHub })),
);
const SeoWorldCupPlayerQuizHub = lazy(() =>
  import('./components/SeoHubs').then((m) => ({ default: m.SeoWorldCupPlayerQuizHub })),
);
const SeoLearnFootballPlayersHub = lazy(() =>
  import('./components/SeoHubs').then((m) => ({ default: m.SeoLearnFootballPlayersHub })),
);
const SeoQuizThemesHub = lazy(() =>
  import('./components/SeoQuizThemes').then((m) => ({ default: m.SeoQuizThemesHub })),
);
const SeoQuizThemeHub = lazy(() =>
  import('./components/SeoQuizThemes').then((m) => ({ default: m.SeoQuizThemeHub })),
);
const ClubQuizMode = lazy(() => import('./components/ClubQuizMode'));
const SeoClubQuizzesHub = lazy(() =>
  import('./components/SeoClubQuizzes').then((m) => ({ default: m.SeoClubQuizzesHub })),
);
const SeoClubQuizCategoryHub = lazy(() =>
  import('./components/SeoClubQuizzes').then((m) => ({ default: m.SeoClubQuizCategoryHub })),
);

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

function ClubQuizRoute() {
  const { search } = useLocation();
  return (
    <Suspense fallback={<PageFallback label="Loading club quiz…" />}>
      <ClubQuizMode key={search} />
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
              element={withPageSuspense(BrowseDatabase, 'Loading browse…')}
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
              path="/league/international"
              element={<Navigate to="/league/external" replace />}
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
            <Route path="/club-quiz" element={<ClubQuizRoute />} />
            <Route path="/about" element={withPageSuspense(AboutPage, 'Loading…')} />
            <Route path="/editorial" element={withPageSuspense(EditorialPolicyPage, 'Loading…')} />
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
            <Route path="/hubs" element={withPageSuspense(SeoHubsIndex, 'Loading…')} />
            <Route path="/hubs/quizzes" element={withPageSuspense(SeoQuizzesHub, 'Loading…')} />
            <Route
              path="/hubs/quizzes/themes"
              element={withPageSuspense(SeoQuizThemesHub, 'Loading…')}
            />
            <Route
              path="/hubs/quizzes/theme/:themeId"
              element={withPageSuspense(SeoQuizThemeHub, 'Loading…')}
            />
            <Route
              path="/hubs/quizzes/clubs"
              element={withPageSuspense(SeoClubQuizzesHub, 'Loading…')}
            />
            <Route
              path="/hubs/quizzes/clubs/:categoryId"
              element={withPageSuspense(SeoClubQuizCategoryHub, 'Loading…')}
            />
            <Route
              path="/hubs/quizzes/league/:leagueId"
              element={withPageSuspense(SeoLeagueQuizHub, 'Loading…')}
            />
            <Route
              path="/hubs/quizzes/team/:teamId"
              element={withPageSuspense(SeoTeamQuizHub, 'Loading…')}
            />
            <Route
              path="/hubs/players/by-nationality"
              element={withPageSuspense(SeoPlayersByNationalityHub, 'Loading…')}
            />
            <Route
              path="/hubs/players/nationality/:nation"
              element={withPageSuspense(SeoNationalityPlayersHub, 'Loading…')}
            />
            <Route
              path="/hubs/players/best-young-footballers"
              element={withPageSuspense(SeoBestYoungFootballersHub, 'Loading…')}
            />
            <Route
              path="/hubs/world-cup/player-quiz"
              element={withPageSuspense(SeoWorldCupPlayerQuizHub, 'Loading…')}
            />
            <Route
              path="/hubs/learn/football-players"
              element={withPageSuspense(SeoLearnFootballPlayersHub, 'Loading…')}
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
            <p>FootyCompass · Navigate the world of football.</p>
            <p className="app__footer__feedback">
              Have feedback, found a bug, or want to suggest a feature? Email us at{' '}
              <a href="mailto:joedesmos.co@gmail.com">joedesmos.co@gmail.com</a>
            </p>
            <p className="app__footer__links">
              <Link to="/browse">Browse</Link> · <Link to="/teams">Clubs</Link> ·{' '}
              <Link to="/national-teams">National teams</Link> · <Link to="/world-cup">World Cup</Link> ·{' '}
              <Link to="/quiz">Quiz</Link> · <Link to="/hubs">Hubs</Link> ·{' '}
              <Link to="/about">About</Link> · <Link to="/editorial">Editorial policy</Link> ·{' '}
              <Link to="/onboarding">How it works</Link> · <Link to="/privacy">Privacy Policy</Link>
            </p>
            <p className="app__footer__privacy">
              No accounts. Progress, favorites, and preferences stay in your browser only — not
              sold or synced to a server.
            </p>
          </footer>
        </div>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
