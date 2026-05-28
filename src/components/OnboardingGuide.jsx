import { Link } from 'react-router-dom';
import { getOnboardingSteps } from '../data/onboardingGuide';

export default function OnboardingGuide({ showLinks = true }) {
  const steps = getOnboardingSteps();

  return (
    <section className="onboarding-guide" aria-labelledby="onboarding-guide-title">
      <h2 id="onboarding-guide-title" className="onboarding-guide__title">
        How FootyCompass works
      </h2>
      <p className="onboarding-guide__lead">
        Find your way around the football world on this device—explore profiles first, then quizzes
        and compare when you are ready.
      </p>
      <ol className="onboarding-guide__list">
        {steps.map((step, index) => (
          <li key={step.id} className="onboarding-guide__item">
            <span className="onboarding-guide__step" aria-hidden="true">
              {index + 1}
            </span>
            <div className="onboarding-guide__body">
              <h3 className="onboarding-guide__item-title">{step.title}</h3>
              <p className="onboarding-guide__item-text">{step.description}</p>
              {showLinks && step.to ? (
                <Link to={step.to} className="onboarding-guide__link">
                  Open {step.label.toLowerCase()}
                </Link>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
