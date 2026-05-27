import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { usePreferences } from '../hooks/usePreferences';
import OnboardingGuide from './OnboardingGuide';
import PreferencesForm from './PreferencesForm';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEdit = searchParams.get('edit') === '1';
  const { preferences, savePreferences } = usePreferences();

  const handleSave = (next) => {
    savePreferences(next);
    navigate(isEdit ? '/profile' : '/');
  };

  const handleSkip = () => {
    navigate('/');
  };

  return (
    <div className="onboarding-page">
      <header className="page-header">
        <p className="page-header__eyebrow">
          {isEdit ? 'Update settings' : 'New here?'}
        </p>
        <h1>{isEdit ? 'Learning preferences' : 'Quick intro'}</h1>
        <p className="onboarding-page__intro">
          {isEdit
            ? 'Adjust leagues, clubs, and goals. Saved on this device only.'
            : 'A quick tour of players, clubs, leagues, and quizzes—saved on this device, no account needed. Personalize below only if you want.'}
        </p>
        {!isEdit && (
          <p className="onboarding-page__skip-top">
            <Link to="/">Skip to home</Link>
          </p>
        )}
        {isEdit && (
          <p className="onboarding-page__back">
            <Link to="/profile">← Back to profile</Link>
          </p>
        )}
      </header>

      {!isEdit && <OnboardingGuide />}

      <section
        className="onboarding-page__prefs"
        aria-labelledby={isEdit ? undefined : 'onboarding-prefs-title'}
      >
        {!isEdit && (
          <>
            <h2 id="onboarding-prefs-title" className="onboarding-page__prefs-title">
              Optional: personalize
            </h2>
            <p className="onboarding-page__prefs-lead">
              Pick leagues and clubs for sharper homepage picks. You can change this anytime from
              your profile.
            </p>
          </>
        )}

        <PreferencesForm
          initial={preferences}
          onSave={handleSave}
          onSkip={isEdit ? null : handleSkip}
          showSkip={!isEdit}
          submitLabel={isEdit ? 'Save changes' : 'Save & continue'}
        />
      </section>
    </div>
  );
}
