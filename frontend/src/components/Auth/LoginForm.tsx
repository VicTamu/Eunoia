import React, { useState } from 'react';
import { Lock, Mail } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { friendlyAuthError } from '../../utils/authErrorMessages';
import { trackEvent } from '../../utils/analytics';
import AuthTextField from './AuthTextField';

interface LoginFormProps {
  onToggleMode: () => void;
}

const PASSWORD_PLACEHOLDER = '********';
const RESET_LINK_HELP =
  'Enter your email above, then tap "Forgot password?" so we know where to send the link.';
const RESET_LINK_NOTICE =
  'If an account exists for that email, we sent a link to reset your password. Check your inbox and spam folder.';

const LoginForm: React.FC<LoginFormProps> = ({ onToggleMode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetNotice, setResetNotice] = useState('');

  const { signIn, resetPasswordForEmail } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResetNotice('');

    try {
      trackEvent('login_submitted');
      const { error: signInError } = await signIn(email, password);
      if (signInError) {
        trackEvent('login_failed');
        setError(friendlyAuthError(signInError));
      } else {
        trackEvent('login', { method: 'email' });
      }
    } catch {
      trackEvent('login_failed');
      setError(friendlyAuthError(new Error('An unexpected error occurred')));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError('');
    setResetNotice('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      trackEvent('password_reset_blocked', { reason: 'missing_email' });
      setError(RESET_LINK_HELP);
      return;
    }

    setResetLoading(true);
    try {
      trackEvent('password_reset_requested');
      const { error: resetError } = await resetPasswordForEmail(trimmedEmail);
      if (resetError) {
        trackEvent('password_reset_failed');
        setError(friendlyAuthError(resetError));
      } else {
        trackEvent('password_reset_email_sent');
        setResetNotice(RESET_LINK_NOTICE);
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="auth-form-panel">
      <form onSubmit={handleSubmit} className="auth-form" aria-busy={loading} noValidate>
        {error ? (
          <div className="status-banner status-banner-error" role="alert" aria-live="assertive">
            {error}
          </div>
        ) : null}

        {resetNotice ? (
          <div className="status-banner status-banner-success" role="status" aria-live="polite">
            {resetNotice}
          </div>
        ) : null}

        <AuthTextField
          id="email"
          label="Email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          placeholder="you@example.com"
          inputType="email"
          leadingIcon={Mail}
        />

        <AuthTextField
          id="password"
          label="Password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          placeholder={PASSWORD_PLACEHOLDER}
          leadingIcon={Lock}
          password={{
            visible: showPassword,
            onToggle: () => setShowPassword((visible) => !visible),
            toggleLabels: { show: 'Show password', hide: 'Hide password' },
          }}
        />

        <p className="auth-link-row">
          <button
            type="button"
            className="auth-inline-link"
            onClick={handleForgotPassword}
            disabled={resetLoading}
          >
            {resetLoading ? 'Sending link...' : 'Forgot password?'}
          </button>
        </p>

        <button type="submit" disabled={loading} className="auth-primary-button">
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <div className="auth-switch">
        <p>
          Don&apos;t have an account?{' '}
          <button
            type="button"
            className="auth-switch-link"
            onClick={() => {
              trackEvent('auth_mode_switched', { mode: 'signup' });
              onToggleMode();
            }}
          >
            Create one
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
