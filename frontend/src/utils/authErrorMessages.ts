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

  const normalizedMessage = raw.toLowerCase();

  if (
    normalizedMessage.includes('invalid login') ||
    normalizedMessage.includes('invalid credentials')
  ) {
    return 'That email or password does not match our records. Try again or reset your password.';
  }

  if (
    normalizedMessage.includes('email not confirmed') ||
    normalizedMessage.includes('not confirmed')
  ) {
    return 'Confirm your email first—we sent a link when you signed up. You can resend it below.';
  }

  if (
    normalizedMessage.includes('already registered') ||
    normalizedMessage.includes('already been registered') ||
    normalizedMessage.includes('user already registered') ||
    normalizedMessage.includes('already exists')
  ) {
    return 'An account with this email already exists. Sign in instead, or use a different email.';
  }

  const looksLikeWeakPasswordError =
    normalizedMessage.includes('password') &&
    (normalizedMessage.includes('least') ||
      normalizedMessage.includes('short') ||
      normalizedMessage.includes('weak'));

  if (looksLikeWeakPasswordError) {
    return 'Choose a stronger password (at least 6 characters, or follow the hints shown).';
  }

  const looksLikeRateLimitError =
    normalizedMessage.includes('rate limit') ||
    normalizedMessage.includes('too many requests') ||
    normalizedMessage.includes('email rate limit');

  if (looksLikeRateLimitError) {
    return 'Too many attempts. Wait a minute and try again.';
  }

  if (normalizedMessage.includes('network') || normalizedMessage.includes('fetch')) {
    return 'Network error. Check your connection and try again.';
  }

  if (normalizedMessage.includes('jwt') || normalizedMessage.includes('session')) {
    return 'Your session expired. Sign in again.';
  }

  return raw.length > 160 ? `${raw.slice(0, 157)}...` : raw;
}
