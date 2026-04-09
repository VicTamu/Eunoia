/**
 * Map Supabase / network auth errors to short, actionable copy.
 */
function extractMessage(error: unknown): string {
  if (error == null) return '';
  if (typeof error === 'string') return error;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return '';
}

export function friendlyAuthError(error: unknown): string {
  const raw = extractMessage(error).trim();
  if (!raw) return 'Something went wrong. Please try again.';

  const m = raw.toLowerCase();

  if (m.includes('invalid login') || m.includes('invalid credentials')) {
    return 'That email or password does not match our records. Try again or reset your password.';
  }
  if (m.includes('email not confirmed') || m.includes('not confirmed')) {
    return 'Confirm your email first—we sent a link when you signed up. You can resend it below.';
  }
  if (
    m.includes('already registered') ||
    m.includes('already been registered') ||
    m.includes('user already registered') ||
    m.includes('already exists')
  ) {
    return 'An account with this email already exists. Sign in instead, or use a different email.';
  }
  const looksLikeWeakPasswordError =
    m.includes('password') && (m.includes('least') || m.includes('short') || m.includes('weak'));
  if (looksLikeWeakPasswordError) {
    return 'Choose a stronger password (at least 6 characters, or follow the hints shown).';
  }
  const looksLikeRateLimitError =
    m.includes('rate limit') || m.includes('too many requests') || m.includes('email rate limit');
  if (looksLikeRateLimitError) {
    return 'Too many attempts. Wait a minute and try again.';
  }
  if (m.includes('network') || m.includes('fetch')) {
    return 'Network error. Check your connection and try again.';
  }
  if (m.includes('jwt') || m.includes('session')) {
    return 'Your session expired. Sign in again.';
  }

  return raw.length > 160 ? `${raw.slice(0, 157)}…` : raw;
}
