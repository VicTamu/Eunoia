import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { friendlyAuthError } from '../../utils/authErrorMessages';
import { trackEvent } from '../../utils/analytics';
import AuthTextField from './AuthTextField';

interface PasswordRecoveryFormProps {
  onCompleted: () => Promise<void> | void;
}

const MIN_PASSWORD_LENGTH = 6;

const PasswordRecoveryForm: React.FC<PasswordRecoveryFormProps> = ({ onCompleted }) => {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      trackEvent('password_update_blocked', { reason: 'password_mismatch' });
      setError('Passwords do not match.');
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      trackEvent('password_update_blocked', { reason: 'password_too_short' });
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
      return;
    }

    setLoading(true);

    try {
      trackEvent('password_update_submitted');
      const { error: updateError } = await updatePassword(password);
      if (updateError) {
        trackEvent('password_update_failed');
        setError(friendlyAuthError(updateError));
        return;
      }

      trackEvent('password_update_succeeded');
      await onCompleted();
    } catch {
      trackEvent('password_update_failed');
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
          id="recovery-password"
          label="New password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
          leadingIcon={Lock}
          helperText={`Use at least ${MIN_PASSWORD_LENGTH} characters.`}
          password={{
            visible: showPassword,
            onToggle: () => setShowPassword((visible) => !visible),
            toggleLabels: { show: 'Show password', hide: 'Hide password' },
          }}
        />

        <AuthTextField
          id="recovery-confirm-password"
          label="Confirm new password"
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
          {loading ? 'Saving new password...' : 'Save new password'}
        </button>
      </form>
    </div>
  );
};

export default PasswordRecoveryForm;
