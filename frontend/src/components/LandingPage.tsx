import React from 'react';
import { ArrowDown, Brain, Leaf, Lock, LogIn, ShieldCheck, TrendingUp } from 'lucide-react';
import AmbientBackground from './AmbientBackground';

export type LandingPageProps = {
  onSignIn: () => void;
  onSignUp: () => void;
};

export default function LandingPage({ onSignIn, onSignUp }: LandingPageProps) {
  const handleExplore = () => {
    document.getElementById('landing-why')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="landing-shell" aria-label="Eunoia welcome">
      <AmbientBackground />
      <div className="landing-inner">
        <header className="landing-nav">
          <div className="landing-brand">
            <span className="landing-brand-mark" aria-hidden>
              <Leaf className="h-5 w-5" strokeWidth={2} />
            </span>
            <span className="landing-brand-text">Eunoia</span>
          </div>
        </header>

        <main className="landing-main">
          <div className="landing-hero-grid">
            <section className="landing-hero-copy">
              <div className="landing-mobile-badge">
                <Leaf className="h-4 w-4" aria-hidden />
                Private daily journal
              </div>
              <h1 className="landing-headline">
                Understand yourself, gently.
                <span className="landing-headline-soft">Reflect with more clarity.</span>
              </h1>
              <p className="landing-lede">
                Eunoia is a private space to write, revisit your days, and see emotional patterns
                unfold with a little more calm and context.
              </p>

              <div className="landing-cta-block">
                <div className="landing-cta-row">
                  <button type="button" className="landing-cta-primary" onClick={onSignIn}>
                    <LogIn className="h-5 w-5" strokeWidth={2} aria-hidden />
                    Sign in
                  </button>
                  <button type="button" className="landing-cta-secondary" onClick={handleExplore}>
                    See how it works
                    <ArrowDown className="h-4 w-4" strokeWidth={2} aria-hidden />
                  </button>
                </div>
                <p className="landing-cta-foot">
                  <span className="landing-cta-foot-muted">New here?</span>{' '}
                  <button type="button" className="landing-cta-foot-link" onClick={onSignUp}>
                    Create an account
                  </button>
                </p>
              </div>
            </section>

            <section className="landing-reflection-preview" aria-label="Eunoia reflection preview">
              <div className="reflection-preview-shell">
                <div className="reflection-preview-header">
                  <div>
                    <span className="reflection-preview-kicker">A live snapshot</span>
                    <h2>Writing, then noticing what it meant.</h2>
                  </div>
                  <span className="reflection-preview-lock">
                    <Lock className="h-4 w-4" aria-hidden />
                    Private
                  </span>
                </div>
                <div className="reflection-preview-entry">
                  <p className="reflection-preview-journal">
                    &ldquo;I felt stretched thin at first, but writing it down helped me notice I
                    wasn&apos;t as lost as I sounded in my head.&rdquo;
                  </p>
                  <div className="reflection-preview-tags">
                    <span>Relief</span>
                    <span>Low stress</span>
                    <span>Evening reflection</span>
                  </div>
                </div>
                <div className="reflection-preview-insight">
                  <TrendingUp className="h-5 w-5" aria-hidden />
                  <p>You tend to write more gently once you name what felt heavy first.</p>
                </div>
              </div>
            </section>
          </div>

          <section id="landing-why" className="landing-value-section" aria-label="Why Eunoia">
            <div className="landing-section-intro">
              <div className="eyebrow">
                <Leaf className="h-4 w-4" aria-hidden />
                Why Eunoia
              </div>
              <h2 className="landing-section-title">A steadier companion for when it matters.</h2>
              <p className="landing-section-lede">
                Built to feel calm, private, and useful enough to come back to when your mind
                already has enough going on.
              </p>
            </div>

            <div className="landing-value-grid">
              <article className="landing-value-card landing-value-card-private">
                <span className="landing-value-icon">
                  <ShieldCheck className="h-5 w-5" aria-hidden />
                </span>
                <h3>Private by design</h3>
                <p>
                  Your entries, patterns, and account stay anchored in your own reflection space.
                </p>
              </article>

              <article className="landing-value-card landing-value-card-insight">
                <span className="landing-value-icon">
                  <Brain className="h-5 w-5" aria-hidden />
                </span>
                <h3>Gentle AI insight</h3>
                <p>
                  Notice mood and stress trends without turning your journal into something clinical
                  or cold.
                </p>
              </article>

              <article className="landing-value-card landing-value-card-journal">
                <span className="landing-value-icon">
                  <Leaf className="h-5 w-5" aria-hidden />
                </span>
                <h3>Your journal, in one place</h3>
                <p>
                  Write, revisit old entries, and keep a readable thread of what your days have been
                  asking of you.
                </p>
              </article>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
