import React from 'react';
import { LogIn, BookOpen } from 'lucide-react';
import AmbientBackground from './AmbientBackground';

export type LandingPageProps = {
  onSignIn: () => void;
  onSignUp: () => void;
};

export default function LandingPage({ onSignIn, onSignUp }: LandingPageProps) {
  return (
    <div className="landing-shell" aria-label="Eunoia welcome">
      <AmbientBackground />
      <div className="landing-inner">
        <header className="landing-nav">
          <div className="landing-brand">
            <span className="landing-brand-mark" aria-hidden>
              <BookOpen className="h-5 w-5" strokeWidth={2} />
            </span>
            <span className="landing-brand-text">Eunoia</span>
          </div>
        </header>

        <main className="landing-main">
          <h1 className="landing-headline">
            Reflect with clarity.
            <span className="landing-headline-soft"> Understand yourself gently.</span>
          </h1>
          <p className="landing-lede">
            Eunoia is a private space to write, revisit your days, and see emotional patterns unfold
            over time — without the noise.
          </p>

          <div className="landing-preview" aria-hidden>
            <p className="landing-preview-label">Inside the app</p>
            <div className="landing-preview-card">
              <div className="landing-preview-chrome">
                <span className="landing-preview-dot" />
                <span className="landing-preview-dot" />
                <span className="landing-preview-dot" />
              </div>
              <div className="landing-preview-body">
                <div className="landing-preview-line landing-preview-line--accent" />
                <div className="landing-preview-line" />
                <div className="landing-preview-line" />
                <div className="landing-preview-line landing-preview-line--short" />
                <div className="landing-preview-pills">
                  <span className="landing-preview-pill" />
                  <span className="landing-preview-pill" />
                  <span className="landing-preview-pill landing-preview-pill--wide" />
                </div>
              </div>
            </div>
          </div>

          <div className="landing-cta-block">
            <div className="landing-cta-row">
              <button type="button" className="landing-cta-primary" onClick={onSignIn}>
                <LogIn className="h-5 w-5" strokeWidth={2} aria-hidden />
                Sign in
              </button>
            </div>
            <p className="landing-cta-foot">
              <span className="landing-cta-foot-muted">New here?</span>{' '}
              <button type="button" className="landing-cta-foot-link" onClick={onSignUp}>
                Create an account
              </button>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
