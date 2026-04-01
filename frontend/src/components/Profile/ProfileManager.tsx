import React, { useCallback, useEffect, useState } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { User, Edit3, Save, X, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import api from '../../services/api';

interface UserProfile {
  id: number;
  user_id: string;
  email: string;
  full_name: string | null;
  display_name: string | null;
  role: string;
  is_active: string;
  created_at: string;
  updated_at: string | null;
  last_login: string | null;
}

interface ProfileManagerProps {
  onClose: () => void;
}

const buildProfileFromUser = (user: SupabaseUser): UserProfile => ({
  id: 0,
  user_id: user.id,
  email: user.email || '',
  full_name: user.user_metadata?.full_name || null,
  display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || null,
  role: 'user',
  is_active: 'true',
  created_at: user.created_at || new Date().toISOString(),
  updated_at: new Date().toISOString(),
  last_login: user.last_sign_in_at || null,
});

const ProfileManager: React.FC<ProfileManagerProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [fullName, setFullName] = useState('');

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setError('Unable to find your current session.');
      return;
    }

    const fallbackProfile = buildProfileFromUser(user);

    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/profile');
      const mergedProfile = {
        ...data,
        email: user.email || data.email,
        full_name: data.full_name || fallbackProfile.full_name,
        display_name: data.display_name || fallbackProfile.display_name,
      };
      setProfile(mergedProfile);
      setEmail(mergedProfile.email || '');
      setDisplayName(mergedProfile.display_name || '');
      setFullName(mergedProfile.full_name || '');
    } catch (_err) {
      setProfile(fallbackProfile);
      setEmail(fallbackProfile.email);
      setDisplayName(fallbackProfile.display_name || '');
      setFullName(fallbackProfile.full_name || '');
      setError('');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleEdit = () => {
    setEditing(true);
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setEditing(false);
    setEmail(profile?.email || user?.email || '');
    setDisplayName(profile?.display_name || '');
    setFullName(profile?.full_name || '');
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    if (!user) {
      setError('You need to be signed in to update your profile.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const trimmedEmail = email.trim().toLowerCase();
      const trimmedDisplayName = displayName.trim();
      const trimmedFullName = fullName.trim();
      const emailChanged = trimmedEmail !== (user.email || '').toLowerCase();

      const { data: authData, error: authError } = await supabase.auth.updateUser({
        ...(emailChanged ? { email: trimmedEmail } : {}),
        data: {
          display_name: trimmedDisplayName,
          full_name: trimmedFullName || null,
        },
      });

      if (authError) {
        throw authError;
      }

      const updatedUser = authData.user ?? user;

      let updatedProfile = {
        ...buildProfileFromUser(updatedUser),
        email: emailChanged ? trimmedEmail : updatedUser.email || trimmedEmail,
        display_name: trimmedDisplayName,
        full_name: trimmedFullName || null,
      };

      try {
        const payload = {
          display_name: trimmedDisplayName,
          full_name: trimmedFullName || null,
        };

        const { data } = await api.put('/profile', payload);
        updatedProfile = {
          ...updatedProfile,
          ...data,
          email: emailChanged ? trimmedEmail : updatedProfile.email,
        };
      } catch (_apiError) {
        // Keep the profile editor responsive even when the API isn't running locally.
      }

      setProfile(updatedProfile);
      setEmail(updatedProfile.email || trimmedEmail);
      setDisplayName(updatedProfile.display_name || trimmedDisplayName);
      setFullName(updatedProfile.full_name || trimmedFullName);
      setEditing(false);
      setSuccess(
        emailChanged
          ? 'Profile updated. Check your inbox to confirm your new email address.'
          : 'Profile updated successfully.',
      );
    } catch (_err) {
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const validateDisplayName = (name: string) => {
    const trimmed = name.trim();
    return trimmed.length >= 2 && trimmed.length <= 50 && /^[a-zA-Z0-9_\s-]+$/.test(trimmed);
  };

  return (
    <div className="preferences-overlay" onClick={onClose}>
      <div className="preferences-modal panel-card" onClick={(e) => e.stopPropagation()}>
        <div className="preferences-header">
          <div>
            <div className="eyebrow">
              <User className="h-4 w-4" />
              Profile
            </div>
            <h2 className="section-title mt-4">Edit your profile</h2>
            <p className="section-copy mt-2">
              Update the name and details that shape how your reflection space feels to you.
            </p>
          </div>
          <button onClick={onClose} className="preferences-close" aria-label="Close profile">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="preferences-content">
          {loading ? (
            <div className="preferences-section">
              <div className="flex items-center justify-center h-32">
                <div
                  className="animate-spin rounded-full h-8 w-8 border-b-2"
                  style={{ borderColor: 'transparent', borderBottomColor: 'var(--icon-accent)' }}
                ></div>
              </div>
            </div>
          ) : (
            <>
              {error ? <div className="status-banner status-banner-error">{error}</div> : null}
              {success ? (
                <div className="status-banner status-banner-success">{success}</div>
              ) : null}

              <section className="preferences-section">
                <div className="preferences-section-heading">
                  <Edit3 className="h-5 w-5" />
                  <div>
                    <h3>Profile details</h3>
                    <p>Keep the basics accurate and choose how your name appears in the app.</p>
                  </div>
                </div>

                <div className="preferences-form-grid">
                  <div className="field-shell field-shell-wide">
                    <label className="field-label">Email address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={!editing}
                      className="field-input"
                    />
                    <p className="field-helper">
                      If you change your email, we&apos;ll send a confirmation link to the new
                      address before the update takes effect.
                    </p>
                  </div>

                  <div className="field-shell">
                    <label className="field-label">Display name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      disabled={!editing}
                      className="field-input"
                      placeholder="Enter your display name"
                    />
                    {editing && displayName && validateDisplayName(displayName) ? (
                      <div className="preferences-validation">
                        <Check className="h-4 w-4" />
                        <span>Looks good</span>
                      </div>
                    ) : null}
                    {editing && displayName && !validateDisplayName(displayName) ? (
                      <p className="preferences-validation preferences-validation-error">
                        Display name must be 2-50 characters and use only letters, numbers, spaces,
                        hyphens, or underscores.
                      </p>
                    ) : null}
                  </div>

                  <div className="field-shell">
                    <label className="field-label">Full name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={!editing}
                      className="field-input"
                      placeholder="Optional full name"
                    />
                  </div>
                </div>
              </section>
            </>
          )}
        </div>

        <div className="preferences-footer">
          {editing ? (
            <>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="preferences-secondary-action"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !validateDisplayName(displayName) || !email.trim()}
                className="primary-action preferences-primary-action"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </>
          ) : (
            <>
              <button onClick={onClose} className="preferences-secondary-action">
                Close
              </button>
              <button onClick={handleEdit} className="primary-action preferences-primary-action">
                <Edit3 className="h-4 w-4" />
                Edit profile
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileManager;
