import React, { useLayoutEffect, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, Mail, UserPlus } from 'lucide-react';
import AmbientBackground from '../AmbientBackground';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import { useAuth } from '../../contexts/AuthContext';
import { friendlyAuthError } from '../../utils/authErrorMessages';

export type AuthMode = 'login' | 'signup';

export type AuthScreenProps = {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  signUpEmailSent: boolean;
  pendingSignupEmail: string;
  onRegistered: (email: string) => void;
  onBackToLanding: () => void;
};

function SignupVerificationPanel({
  email,
  onBackToSignIn,
}: {
  email: string;
  onBackToSignIn: () => void;
}) {
  const { resendSignupEmail } = useAuth();
  const [sending, setSending] = useState(false);
  const [resendMessage, setResendMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null,
  );

  const handleResend = async () => {
    if (!email.trim()) return;
    setSending(true);
    setResendMessage(null);
    try {
      const { error } = await resendSignupEmail(email.trim());
      if (error) {
        setResendMessage({ type: 'err', text: friendlyAuthError(error) });
      } else {
        setResendMessage({
          type: 'ok',
          text: 'Another confirmation email is on its way. Check your inbox and spam folder.',
        });
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="auth-form-panel">
      <p className="auth-verification-lead">
        We sent a confirmation link to <strong className="auth-verification-email">{email}</strong>.
        Open it, verify your account, then return here to sign in.
      </p>
      {resendMessage ? (
        <div
          className={`status-banner ${resendMessage.type === 'ok' ? 'status-banner-success' : 'status-banner-error'}`}
          role={resendMessage.type === 'err' ? 'alert' : 'status'}
          aria-live="polite"
        >
          {resendMessage.text}
        </div>
      ) : null}
      <div className="auth-verification-actions">
        <button
          type="button"
          className="auth-secondary-button"
          onClick={handleResend}
          disabled={sending || !email.trim()}
        >
          {sending ? 'Sending…' : 'Resend confirmation email'}
        </button>
        <button type="button" className="auth-primary-button" onClick={onBackToSignIn}>
          Back to sign in
        </button>
      </div>
    </div>
  );
}

export default function AuthScreen({
  mode,
  onModeChange,
  signUpEmailSent,
  pendingSignupEmail,
  onRegistered,
  onBackToLanding,
}: AuthScreenProps) {
  const authWhyRef = useRef<HTMLDetailsElement>(null);

  useLayoutEffect(() => {
    const el = authWhyRef.current;
    if (!el) return;
    const mq = window.matchMedia('(min-width: 1025px)');
    const syncOpen = () => {
      el.open = mq.matches;
    };
    syncOpen();
    mq.addEventListener('change', syncOpen);
    return () => mq.removeEventListener('change', syncOpen);
  }, []);

  const shellContext =
    mode === 'login'
      ? 'Sign in to continue'
      : signUpEmailSent
        ? 'Verify your email'
        : 'Create your account';

  return (
    <div className="auth-shell">
      <AmbientBackground />
      <button
        type="button"
        className="auth-back-icon"
        onClick={onBackToLanding}
        aria-label="Back to home"
      >
        <ArrowLeft className="auth-back-icon-svg" strokeWidth={2.25} aria-hidden />
      </button>

      <header className="auth-shell-top">
        <p className="auth-shell-context">{shellContext}</p>
      </header>

      <section className="auth-story auth-story--compact">
        <div>
          <h1>You&apos;re almost there</h1>
          <p className="auth-story-lead">
            Sign in to open your journal—your entries and trends stay private to you.
          </p>

          <details ref={authWhyRef} className="auth-why">
            <summary className="auth-why-summary">Why Eunoia?</summary>
            <ul className="auth-why-list">
              <li>
                <strong>Write</strong> — A calm space for quick check-ins or longer reflections.
              </li>
              <li>
                <strong>Notice</strong> — Mood and stress patterns over time, without chart
                overload.
              </li>
              <li>
                <strong>Privacy</strong> — Built for personal journaling first.
              </li>
            </ul>
          </details>
        </div>
      </section>

      <section className="auth-card-shell">
        <div className="auth-card">
          {mode === 'signup' && signUpEmailSent ? (
            <header className="auth-card-header auth-card-header--compact">
              <div className="auth-mini-brand">
                <span className="auth-mini-brand-mark">
                  <BookOpen className="h-6 w-6" aria-hidden />
                </span>
                <div>
                  <strong className="auth-card-product-name">Eunoia</strong>
                  <div className="auth-card-product-tagline muted-copy">Journal</div>
                </div>
              </div>
              <div className="eyebrow auth-card-eyebrow">
                <Mail className="h-4 w-4" aria-hidden />
                Next step
              </div>
              <h2 className="auth-card-title">Check your email</h2>
              <p className="auth-card-lead">
                One more step to keep your journal private—we need to confirm this address.
              </p>
            </header>
          ) : (
            <header className="auth-card-header">
              <div className="auth-mini-brand">
                <span className="auth-mini-brand-mark">
                  <BookOpen className="h-6 w-6" aria-hidden />
                </span>
                <div>
                  <strong className="auth-card-product-name">Eunoia</strong>
                  <div className="auth-card-product-tagline muted-copy">Journal</div>
                </div>
              </div>
              {mode === 'signup' ? (
                <div className="eyebrow auth-card-eyebrow">
                  <UserPlus className="h-4 w-4" aria-hidden />
                  New account
                </div>
              ) : null}
              <h2 className="auth-card-title">
                {mode === 'login' ? 'Welcome back!' : 'Create your account'}
              </h2>
              {mode === 'signup' ? (
                <p className="auth-card-lead">
                  Start your journaling rhythm—takes less than a minute.
                </p>
              ) : null}
            </header>
          )}

          <div className="auth-card-body">
            {mode === 'login' ? (
              <LoginForm onToggleMode={() => onModeChange('signup')} />
            ) : signUpEmailSent ? (
              <SignupVerificationPanel
                email={pendingSignupEmail}
                onBackToSignIn={() => onModeChange('login')}
              />
            ) : (
              <SignupForm onToggleMode={() => onModeChange('login')} onRegistered={onRegistered} />
            )}
          </div>
        </div>
      </section>

      <footer className="auth-shell-footer">
        <p className="auth-shell-footer-text">
          Reflect with a little more honesty. Notice yourself with a little more grace.
        </p>
      </footer>
    </div>
  );
}
