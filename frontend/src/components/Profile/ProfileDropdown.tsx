import React, { useState, useRef, useEffect } from 'react';
import { Settings, LogOut, ChevronDown, Edit3, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import PreferencesModal from './PreferencesModal';
import ProfileManager from './ProfileManager';

interface ProfileDropdownProps {
  onSignOut: () => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ onSignOut }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showProfileManager, setShowProfileManager] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOut = () => {
    setIsOpen(false);
    onSignOut();
  };

  const handlePreferences = () => {
    setIsOpen(false);
    setShowPreferences(true);
  };

  const handleEditProfile = () => {
    setIsOpen(false);
    setShowProfileManager(true);
  };

  const getDisplayName = () => {
    return (
      user?.user_metadata?.display_name ||
      user?.user_metadata?.full_name ||
      user?.email?.split('@')[0] ||
      'User'
    );
  };

  const getInitials = () => {
    const name = getDisplayName();
    return name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <div className="profile-menu-shell" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`profile-trigger ${isOpen ? 'profile-trigger-open' : ''}`}
          aria-expanded={isOpen}
          aria-haspopup="menu"
        >
          <div className="profile-trigger-avatar">{getInitials()}</div>
          <div className="profile-trigger-copy">
            <span className="profile-trigger-name">{getDisplayName()}</span>
            <span className="profile-trigger-subtitle">Workspace</span>
          </div>
          <ChevronDown
            className={`h-4 w-4 profile-trigger-chevron ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isOpen && (
          <div className="profile-popover" role="menu">
            <div className="profile-panel-header">
              <div className="profile-panel-identity">
                <div className="profile-panel-avatar">{getInitials()}</div>
                <div className="profile-panel-copy">
                  <p className="profile-panel-name">{getDisplayName()}</p>
                  <p className="profile-panel-email">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handlePreferences}
                className="profile-settings-shortcut"
                title="Open preferences"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>
            </div>

            <div className="profile-quick-actions">
              <button onClick={handleEditProfile} className="profile-quick-action">
                <Edit3 className="h-4 w-4" />
                <span>Edit profile</span>
              </button>
              <button onClick={handlePreferences} className="profile-quick-action">
                <Settings className="h-4 w-4" />
                <span>Preferences</span>
              </button>
            </div>
            <div className="profile-panel-footer">
              <button onClick={handleSignOut} className="profile-signout">
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>

      {showPreferences && <PreferencesModal onClose={() => setShowPreferences(false)} />}
      {showProfileManager && <ProfileManager onClose={() => setShowProfileManager(false)} />}
    </>
  );
};

export default ProfileDropdown;
