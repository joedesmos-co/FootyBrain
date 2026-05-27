import { useMemo } from 'react';
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { usePreferences } from '../hooks/usePreferences';
import PreferencesForm from './PreferencesForm';
import ProgressPage from './ProgressPage';
import SavedPage from './SavedPage';

function getTab(searchParams) {
  const raw = searchParams.get('tab') || 'progress';
  if (raw === 'stats') return 'progress';
  if (raw === 'preferences') return 'preferences';
  if (raw === 'saved') return 'saved';
  return 'progress';
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tab = useMemo(() => getTab(searchParams), [searchParams]);
  const { preferences, savePreferences } = usePreferences();

  const handleSave = (next) => {
    savePreferences(next);
    navigate('/profile?tab=preferences');
  };

  return (
    <div className="page profile-page">
      <header className="page-header">
        <h1>Profile</h1>
        <p>Your progress, saved players/clubs, and learning preferences — stored on this device.</p>
        <nav className="compare-tabs" aria-label="Profile sections">
          <NavLink
            to="/profile?tab=progress"
            className={`compare-tabs__tab${tab === 'progress' ? ' compare-tabs__tab--active' : ''}`}
          >
            Stats
          </NavLink>
          <NavLink
            to="/profile?tab=saved"
            className={`compare-tabs__tab${tab === 'saved' ? ' compare-tabs__tab--active' : ''}`}
          >
            Saved
          </NavLink>
          <NavLink
            to="/profile?tab=preferences"
            className={`compare-tabs__tab${tab === 'preferences' ? ' compare-tabs__tab--active' : ''}`}
          >
            Preferences
          </NavLink>
        </nav>
      </header>

      {tab === 'progress' ? <ProgressPage showBackLink={false} /> : null}
      {tab === 'saved' ? <SavedPage /> : null}
      {tab === 'preferences' ? (
        <section className="profile-page__prefs" aria-label="Learning preferences">
          <PreferencesForm
            initial={preferences}
            onSave={handleSave}
            onSkip={null}
            showSkip={false}
            submitLabel="Save changes"
          />
        </section>
      ) : null}
    </div>
  );
}

