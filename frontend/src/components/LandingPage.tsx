import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  Brain,
  Leaf,
  Lock,
  LogIn,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import AmbientBackground from './AmbientBackground';

export type LandingPageProps = {
  onSignIn: () => void;
  onSignUp: () => void;
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

export default function LandingPage({ onSignIn, onSignUp }: LandingPageProps) {
  const [promptValue, setPromptValue] = useState('');
  const [hasTriedPrompt, setHasTriedPrompt] = useState(false);

  const promptNudge = useMemo(() => {
    if (!promptValue.trim()) {
      return "That's yours to keep. Create a free space to hold it.";
    }

    return "That's a meaningful place to start. Create a free space to keep going.";
  }, [promptValue]);

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
    document
      .getElementById('landing-how-it-works')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handlePromptSubmit = () => {
    setHasTriedPrompt(true);
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

            <section
              className="landing-reflection-preview"
              aria-label="Eunoia reflection preview"
              data-reveal
            >
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
            <p className="landing-statement-text">
              Most apps ask you to perform. Eunoia just asks you to notice.
            </p>
          </section>

          <section
            id="landing-how-it-works"
            className="landing-detail-section landing-band landing-band-contrast"
            aria-label="How Eunoia works"
            data-reveal
          >
            <div className="landing-process-layout">
              <div className="landing-section-intro landing-process-intro">
                <div className="eyebrow">
                  <Sparkles className="h-4 w-4" aria-hidden />
                  How it works
                </div>
                <h2 className="landing-section-title landing-section-title-supporting">
                  A simple rhythm you can actually return to.
                </h2>
                <p className="landing-section-lede">
                  The goal is not to optimize your inner life. It&apos;s to make reflection feel a
                  little easier to begin, notice, and revisit.
                </p>
              </div>

              <div className="landing-process-rail">
                <article className="landing-process-card">
                  <span className="landing-process-step">01</span>
                  <div className="landing-process-copy">
                    <h3>Write what stayed with you</h3>
                    <p>
                      Start with the day as it felt, even if all you have is a few honest sentences.
                    </p>
                  </div>
                </article>
                <article className="landing-process-card">
                  <span className="landing-process-step">02</span>
                  <div className="landing-process-copy">
                    <h3>Notice the shape of it</h3>
                    <p>
                      Eunoia helps surface mood, stress, and emotional patterns without interrupting
                      the writing itself.
                    </p>
                  </div>
                </article>
                <article className="landing-process-card">
                  <span className="landing-process-step">03</span>
                  <div className="landing-process-copy">
                    <h3>Return with more context</h3>
                    <p>
                      Revisit earlier entries and see what your days have been quietly repeating
                      back to you.
                    </p>
                  </div>
                </article>
              </div>
            </div>
          </section>

          <section
            className="landing-detail-section landing-band landing-band-try"
            aria-label="Try a reflection prompt"
            data-reveal
          >
            <div className="landing-prompt-layout">
              <div className="landing-prompt-panel">
                <div className="eyebrow">
                  <Sparkles className="h-4 w-4" aria-hidden />
                  Try a prompt
                </div>
                <h2 className="landing-section-title landing-section-title-supporting">
                  Try one honest sentence before you decide.
                </h2>
                <p className="landing-section-lede">
                  You do not need to know the whole shape of the day. Start with what stayed.
                </p>
              </div>

              <div className="landing-prompt-card">
                <label className="landing-prompt-label" htmlFor="landing-try-prompt">
                  What has stayed with you today?
                </label>
                <textarea
                  id="landing-try-prompt"
                  className="landing-prompt-textarea"
                  value={promptValue}
                  onChange={(event) => setPromptValue(event.target.value)}
                  onFocus={() => setHasTriedPrompt(false)}
                  onKeyDown={(event) => {
                    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                      event.preventDefault();
                      handlePromptSubmit();
                    }
                  }}
                  placeholder="Write a word, a sentence, or the first thing that keeps returning."
                  rows={5}
                />
                <div className="landing-prompt-actions">
                  <button
                    type="button"
                    className="landing-cta-primary"
                    onClick={handlePromptSubmit}
                  >
                    Keep this safely
                  </button>
                  <p className="landing-prompt-hint">Press save or just pause here for a moment.</p>
                </div>
                {hasTriedPrompt ? (
                  <button
                    type="button"
                    className="landing-prompt-nudge"
                    onClick={onSignUp}
                    aria-live="polite"
                  >
                    <span>{promptNudge}</span>
                    <ArrowDown className="h-4 w-4" strokeWidth={2} aria-hidden />
                  </button>
                ) : null}
              </div>
            </div>
          </section>

          <section
            className="landing-detail-section landing-band landing-band-soft landing-detail-section-reversed"
            aria-label="Privacy and questions"
            data-reveal
          >
            <div className="landing-support-band">
              <div className="landing-support-grid">
                <div className="landing-faq-stack landing-faq-stack-leading">
                  {faqItems.map((item) => (
                    <article key={item.question} className="landing-faq-card">
                      <h3>{item.question}</h3>
                      <p>{item.answer}</p>
                    </article>
                  ))}
                </div>

                <article className="landing-support-copy landing-support-copy-right">
                  <div className="eyebrow">
                    <Lock className="h-4 w-4" aria-hidden />
                    Private by design
                  </div>
                  <h2 className="landing-section-title landing-section-title-supporting">
                    A journal space, not a performance space.
                  </h2>
                  <p className="landing-section-lede">
                    No public feed. No audience to manage. Just your entries, your patterns, and a
                    quieter way to come back to yourself.
                  </p>
                </article>
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
                <button type="button" className="landing-cta-primary" onClick={onSignUp}>
                  Create an account
                </button>
                <button type="button" className="landing-cta-secondary" onClick={onSignIn}>
                  Already have a space?
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
