import React, { useState } from 'react';
import { Lock, Mail } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { friendlyAuthError } from '../../utils/authErrorMessages';
import { trackEvent } from '../../utils/analytics';
import AuthTextField from './AuthTextField';

interface SignupFormProps {
  onToggleMode: () => void;
  onRegistered: (email: string) => void;
}

const MIN_PASSWORD_LENGTH = 6;

const SignupForm: React.FC<SignupFormProps> = ({ onToggleMode, onRegistered }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      trackEvent('signup_blocked', { reason: 'password_mismatch' });
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      trackEvent('signup_blocked', { reason: 'password_too_short' });
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
      setLoading(false);
      return;
    }

    const trimmedEmail = email.trim();

    try {
      trackEvent('signup_submitted');
      const { error: signUpError } = await signUp(trimmedEmail, password);
      if (signUpError) {
        trackEvent('signup_failed');
        setError(friendlyAuthError(signUpError));
      } else {
        trackEvent('sign_up', { method: 'email' });
        onRegistered(trimmedEmail);
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      }
    } catch {
      setError(friendlyAuthError(new Error('An unexpected error occurred')));
    } finally {
      setLoading(false);
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

        <AuthTextField
          id="signup-email"
          label="Email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          placeholder="you@example.com"
          inputType="email"
          leadingIcon={Mail}
        />

        <AuthTextField
          id="signup-password"
          label="Password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
          leadingIcon={Lock}
          password={{
            visible: showPassword,
            onToggle: () => setShowPassword((visible) => !visible),
            toggleLabels: { show: 'Show password', hide: 'Hide password' },
          }}
          helperText={`Use at least ${MIN_PASSWORD_LENGTH} characters.`}
        />

        <AuthTextField
          id="confirmPassword"
          label="Confirm password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          autoComplete="new-password"
          placeholder="Repeat password"
          leadingIcon={Lock}
          password={{
            visible: showConfirmPassword,
            onToggle: () => setShowConfirmPassword((visible) => !visible),
            toggleLabels: { show: 'Show confirm password', hide: 'Hide confirm password' },
          }}
        />

        <button type="submit" disabled={loading} className="auth-primary-button">
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <div className="auth-switch">
        <p>
          Already have an account?{' '}
          <button
            type="button"
            className="auth-switch-link"
            onClick={() => {
              trackEvent('auth_mode_switched', { mode: 'login' });
              onToggleMode();
            }}
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignupForm;
