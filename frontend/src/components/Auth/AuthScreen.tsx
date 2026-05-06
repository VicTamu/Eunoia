import React, { useState } from 'react';
import { ArrowLeft, Leaf, Mail, TrendingUp, UserPlus } from 'lucide-react';
import AmbientBackground from '../AmbientBackground';
import LoginForm from './LoginForm';
import PasswordRecoveryForm from './PasswordRecoveryForm';
import SignupForm from './SignupForm';
import { useAuth } from '../../contexts/AuthContext';
import { friendlyAuthError } from '../../utils/authErrorMessages';

export type AuthMode = 'login' | 'signup' | 'recovery';

export type AuthScreenProps = {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  signUpEmailSent: boolean;
  pendingSignupEmail: string;
  onRegistered: (email: string) => void;
  onBackToLanding: () => void;
};

const loginNoticingPoints = [
  {
    title: 'Emotional rhythms',
    copy: 'See when gratitude, steadiness, nervousness, or heaviness tend to return.',
  },
  {
    title: 'Stress clusters',
    copy: 'Notice the days that ask more of you before they blur together.',
  },
  {
    title: 'What helps',
    copy: 'Return to the entries where you sounded more grounded than you felt.',
  },
];

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
          className={`status-banner ${
            resendMessage.type === 'ok' ? 'status-banner-success' : 'status-banner-error'
          }`}
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
          {sending ? 'Sending...' : 'Resend confirmation email'}
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
  const { clearPasswordRecovery, signOut } = useAuth();

  const loginLead = (
    <>
      <span className="auth-story-lead-line">Come back to yourself.</span>
      <span className="auth-story-lead-line">
        Your entries, patterns, and everything you noticed are still here, still yours.
      </span>
    </>
  );

  const shellContext =
    mode === 'recovery'
      ? 'Reset your password'
      : mode === 'login'
        ? 'Sign in to continue'
        : signUpEmailSent
          ? 'Verify your email'
          : 'Create your account';

  const authTitle =
    mode === 'recovery'
      ? 'Choose a new password.'
      : mode === 'login'
        ? 'Your space is waiting.'
        : 'Start your reflection space.';

  const authLead =
    mode === 'recovery'
      ? 'This link is ready to finish the reset. Save a new password, then sign back in.'
      : mode === 'login'
        ? loginLead
        : 'Create your account to keep your journal private, steady, and ready when you need it.';

  const handleRecoveryComplete = async () => {
    clearPasswordRecovery();
    await signOut();
    onModeChange('login');
  };

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
        <div className="auth-story-copy">
          <h1>{authTitle}</h1>
          <p className="auth-story-lead">{authLead}</p>
        </div>
      </section>

      <section className={`auth-card-shell ${mode === 'login' ? 'auth-card-shell-login' : ''}`}>
        {mode === 'login' ? (
          <aside
            className="auth-side-panel auth-side-panel-left"
            aria-label="What you start noticing"
          >
            <div className="auth-side-card">
              <h2 className="auth-side-title">Gain a clearer sense of your rhythm.</h2>
              <p className="auth-side-copy">
                Over time, your journal becomes easier to return to because it starts holding more
                than memory. It starts holding patterns.
              </p>
            </div>
          </aside>
        ) : null}

        <div className="auth-card">
          {mode === 'recovery' ? (
            <header className="auth-card-header auth-card-header--compact">
              <div className="auth-mini-brand">
                <span className="auth-mini-brand-mark">
                  <Leaf className="h-6 w-6" aria-hidden />
                </span>
                <div>
                  <strong className="auth-card-product-name">Eunoia</strong>
                  <div className="auth-card-product-tagline muted-copy">Journal</div>
                </div>
              </div>
              <h2 className="auth-card-title">Set your new password</h2>
              <p className="auth-card-lead">
                Once it is saved, you will be returned to sign in with the updated password.
              </p>
            </header>
          ) : mode === 'signup' && signUpEmailSent ? (
            <header className="auth-card-header auth-card-header--compact">
              <div className="auth-mini-brand">
                <span className="auth-mini-brand-mark">
                  <Leaf className="h-6 w-6" aria-hidden />
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
                One more step to keep your journal private. We need to confirm this address.
              </p>
            </header>
          ) : (
            <header className="auth-card-header">
              <div className="auth-mini-brand">
                <span className="auth-mini-brand-mark">
                  <Leaf className="h-6 w-6" aria-hidden />
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
              {mode === 'signup' ? <h2 className="auth-card-title">Create your account</h2> : null}
              {mode === 'signup' ? (
                <p className="auth-card-lead">
                  Start your journaling rhythm. It takes less than a minute.
                </p>
              ) : null}
            </header>
          )}

          <div className="auth-card-body">
            {mode === 'recovery' ? (
              <PasswordRecoveryForm onCompleted={handleRecoveryComplete} />
            ) : mode === 'login' ? (
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

        {mode === 'login' ? (
          <aside
            className="auth-side-panel auth-side-panel-right"
            aria-label="What you start noticing"
          >
            <div className="auth-side-card">
              <div className="auth-side-kicker">
                <TrendingUp className="h-4 w-4" aria-hidden />
                What you start noticing
              </div>
              <div className="auth-side-point-list">
                {loginNoticingPoints.map((item) => (
                  <article key={item.title} className="auth-side-point">
                    <h3>{item.title}</h3>
                    <p>{item.copy}</p>
                  </article>
                ))}
              </div>
            </div>
          </aside>
        ) : null}
      </section>

      <footer className="auth-shell-footer">
        <p className="auth-shell-footer-text">
          Your journal is personal. Eunoia keeps the experience calm, private, and easy to return
          to.
        </p>
      </footer>
    </div>
  );
}
