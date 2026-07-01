import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  Brain,
  Home,
  Leaf,
  Lock,
  PenLine,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import AmbientBackground from './AmbientBackground';
import {
  analyzeDemoEntry,
  DEMO_EXAMPLE_QUOTE,
  DEMO_EXAMPLE_RESULT,
  DemoAnalysis,
} from '../utils/demoAnalysis';
import { trackEvent } from '../utils/analytics';

export type LandingPageProps = {
  onSignIn: () => void;
  onSignUp: () => void;
  authed?: boolean;
  onBack?: () => void;
};

const faqItems = [
  {
    question: 'Do I have to write every day?',
    answer:
      'No. Eunoia works best as a rhythm, not a streak. Even a few honest check-ins create a meaningful thread over time.',
  },
  {
    question: 'Is the analysis replacing therapy?',
    answer:
      'No. The insight layer is there to help you notice patterns in your own words. It is supportive context, not medical advice.',
  },
  {
    question: 'Is my journal private?',
    answer:
      'Yes. Eunoia is designed as a personal reflection space, not a social feed or public profile.',
  },
];

const processSteps = [
  {
    step: '01',
    title: 'Write what stayed with you',
    copy: 'Start with the day as it felt, even if all you have is a few honest sentences.',
  },
  {
    step: '02',
    title: 'Notice the shape of it',
    copy: 'Eunoia helps surface mood, stress, and emotional patterns without interrupting the writing itself.',
  },
  {
    step: '03',
    title: 'Return with more context',
    copy: 'Revisit earlier entries and see what your days have been quietly repeating back to you.',
  },
];

export default function LandingPage({
  onSignIn,
  onSignUp,
  authed = false,
  onBack,
}: LandingPageProps) {
  const backToJournal = onBack ?? (() => undefined);
  const [demoText, setDemoText] = useState('');
  const [demoResult, setDemoResult] = useState<DemoAnalysis | null>(null);

  const hasOwnReading = demoResult !== null;
  const activeResult = demoResult ?? DEMO_EXAMPLE_RESULT;
  const shownQuote = hasOwnReading ? demoText.trim() : DEMO_EXAMPLE_QUOTE;

  const runDemo = () => {
    const trimmed = demoText.trim();
    if (!trimmed) {
      return;
    }
    trackEvent('landing_demo_analyzed', { character_count: trimmed.length });
    setDemoResult(analyzeDemoEntry(trimmed));
  };

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (!elements.length) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: '0px 0px -48px 0px' },
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  const handleExplore = () => {
    trackEvent('landing_explore_clicked');
    document
      .getElementById('landing-how-it-works')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
            <section className="landing-hero-copy" data-reveal>
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
                  {authed ? (
                    <button
                      type="button"
                      className="landing-cta-primary"
                      onClick={() => {
                        trackEvent('landing_back_to_journal_clicked', { location: 'hero' });
                        backToJournal();
                      }}
                    >
                      <Home className="h-5 w-5" strokeWidth={2} aria-hidden />
                      Back to your journal
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="landing-cta-primary"
                      onClick={() => {
                        trackEvent('landing_sign_up_clicked', { location: 'hero_primary' });
                        onSignUp();
                      }}
                    >
                      <PenLine className="h-5 w-5" strokeWidth={2} aria-hidden />
                      Start writing, free
                    </button>
                  )}
                  <button type="button" className="landing-cta-secondary" onClick={handleExplore}>
                    See how it works
                    <ArrowDown className="h-4 w-4" strokeWidth={2} aria-hidden />
                  </button>
                </div>
                {authed ? null : (
                  <>
                    <ul className="landing-trust-row" aria-label="What to expect">
                      <li>Free to start</li>
                      <li>Private by design</li>
                      <li>No feed, no audience</li>
                    </ul>
                    <p className="landing-cta-foot">
                      <span className="landing-cta-foot-muted">Already have a space?</span>{' '}
                      <button
                        type="button"
                        className="landing-cta-foot-link"
                        onClick={() => {
                          trackEvent('landing_sign_in_clicked', { location: 'hero_foot' });
                          onSignIn();
                        }}
                      >
                        Sign in
                      </button>
                    </p>
                  </>
                )}
              </div>
            </section>

            <section className="landing-reflection-preview" aria-label="Try Eunoia" data-reveal>
              <div className="reflection-preview-shell">
                <div className="reflection-preview-header">
                  <div>
                    <span className="reflection-preview-kicker">Try it now</span>
                    <h2>Write a line. See what Eunoia notices.</h2>
                  </div>
                  <span className="reflection-preview-lock">
                    <Lock className="h-4 w-4" aria-hidden />
                    Private
                  </span>
                </div>

                <div className="reflection-demo-field">
                  <label className="sr-only" htmlFor="landing-demo-input">
                    Write how today actually felt
                  </label>
                  <textarea
                    id="landing-demo-input"
                    className="reflection-demo-textarea"
                    value={demoText}
                    onChange={(event) => setDemoText(event.target.value)}
                    onKeyDown={(event) => {
                      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                        event.preventDefault();
                        runDemo();
                      }
                    }}
                    placeholder="Type how today actually felt, even a single honest sentence."
                    rows={3}
                  />
                  <button
                    type="button"
                    className="reflection-demo-run"
                    onClick={runDemo}
                    disabled={!demoText.trim()}
                  >
                    <Sparkles className="h-4 w-4" aria-hidden />
                    Read it back to me
                  </button>
                </div>

                <div className="reflection-preview-entry" aria-live="polite">
                  <span className="reflection-demo-tag">
                    {hasOwnReading ? 'Your words' : 'Example'}
                  </span>
                  <p className="reflection-preview-journal">&ldquo;{shownQuote}&rdquo;</p>
                  <div className="reflection-preview-tags">
                    {activeResult.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                  <div className="reflection-demo-readout">
                    <div className="reflection-demo-metric">
                      <span>Mood</span>
                      <strong>{activeResult.mood.toFixed(1)}/10</strong>
                    </div>
                    <div className="reflection-demo-metric">
                      <span>Stress</span>
                      <strong>{activeResult.stress.toFixed(1)}/10</strong>
                    </div>
                  </div>
                </div>

                <div className="reflection-preview-insight">
                  <TrendingUp className="h-5 w-5" aria-hidden />
                  <p>{activeResult.insight}</p>
                </div>

                <button
                  type="button"
                  className="reflection-demo-cta"
                  onClick={() => {
                    trackEvent(
                      authed ? 'landing_back_to_journal_clicked' : 'landing_sign_up_clicked',
                      {
                        location: 'demo_cta',
                        has_demo_result: hasOwnReading,
                      },
                    );
                    if (authed) {
                      backToJournal();
                    } else {
                      onSignUp();
                    }
                  }}
                >
                  {authed
                    ? 'Back to your journal'
                    : hasOwnReading
                      ? 'Keep this, create your free space'
                      : 'Start your own, it’s free'}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </section>
          </div>

          <section
            id="landing-why"
            className="landing-value-section landing-band landing-band-soft"
            aria-label="Why Eunoia"
            data-reveal
          >
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

          <section
            className="landing-statement-band"
            aria-label="Eunoia brand statement"
            data-reveal
          >
            <p className="landing-statement-text">Eunoia just asks you to notice.</p>
          </section>

          <section
            id="landing-how-it-works"
            className="landing-detail-section landing-band landing-band-contrast"
            aria-label="How Eunoia works"
            data-reveal
          >
            <div className="landing-section-intro landing-process-intro">
              <div className="eyebrow">
                <Sparkles className="h-4 w-4" aria-hidden />
                How it works
              </div>
              <h2 className="landing-section-title">A simple rhythm you can actually return to.</h2>
              <p className="landing-section-lede">
                No streaks to keep up. Just a few honest minutes that quietly add up to something
                you can read back.
              </p>
            </div>

            <div className="landing-option-stack">
              <article className="landing-option-card">
                <div className="landing-option-body landing-option-body-timeline">
                  <div className="landing-timeline-node">
                    <div className="landing-process-copy">
                      <h3>Write what stayed with you</h3>
                      <p>{processSteps[0].copy}</p>
                    </div>
                  </div>
                  <div className="landing-timeline-node">
                    <div className="landing-process-copy">
                      <h3>Notice the shape of it</h3>
                      <p>{processSteps[1].copy}</p>
                    </div>
                  </div>
                  <div className="landing-timeline-node">
                    <div className="landing-process-copy">
                      <h3>Return with more context</h3>
                      <p>{processSteps[2].copy}</p>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </section>

          <section
            className="landing-detail-section landing-band landing-band-soft"
            aria-label="Frequently asked questions"
            data-reveal
          >
            <div className="landing-support-band">
              <div className="landing-section-intro landing-faq-intro">
                <div className="eyebrow">
                  <Lock className="h-4 w-4" aria-hidden />
                  FAQs
                </div>
                <h2 className="landing-section-title landing-section-title-supporting">
                  A journal space, not a performance space.
                </h2>
                <p className="landing-section-lede">
                  No public feed. No audience to manage. Just your entries, your patterns, and a
                  quieter way to come back to yourself.
                </p>
              </div>

              <div className="landing-faq-stack landing-faq-stack-leading">
                {faqItems.map((item) => (
                  <article key={item.question} className="landing-faq-card">
                    <h3>{item.question}</h3>
                    <p>{item.answer}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="landing-final-cta" aria-label="Create your journal space" data-reveal>
            <div className="landing-final-cta-card">
              <div className="eyebrow">
                <Leaf className="h-4 w-4" aria-hidden />
                Begin softly
              </div>
              <h2 className="landing-section-title">A quieter place is ready when you are.</h2>
              <p className="landing-section-lede">
                Start with one entry. Let the rest become clearer over time.
              </p>
              <div className="landing-final-cta-actions">
                {authed ? (
                  <button
                    type="button"
                    className="landing-cta-primary"
                    onClick={() => {
                      trackEvent('landing_back_to_journal_clicked', { location: 'final_cta' });
                      backToJournal();
                    }}
                  >
                    Back to your journal
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="landing-cta-primary"
                      onClick={() => {
                        trackEvent('landing_sign_up_clicked', { location: 'final_cta' });
                        onSignUp();
                      }}
                    >
                      Create an account
                    </button>
                    <button
                      type="button"
                      className="landing-cta-secondary"
                      onClick={() => {
                        trackEvent('landing_sign_in_clicked', { location: 'final_cta' });
                        onSignIn();
                      }}
                    >
                      Already have a space?
                    </button>
                  </>
                )}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
