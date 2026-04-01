import React, { useState, useRef, useEffect } from 'react';
import {
  Settings,
  Palette,
  LogOut,
  ChevronDown,
  Edit3,
  Shield,
  Check,
  SlidersHorizontal,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme, Theme } from '../../contexts/ThemeContext';
import PreferencesModal from './PreferencesModal';

interface ProfileDropdownProps {
  onSignOut: () => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ onSignOut }) => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
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

  type ThemeOption = {
    value: Theme;
    label: string;
    color: string;
  };

  const themeOptions: ThemeOption[] = [
    { value: 'light', label: 'Light', color: 'linear-gradient(135deg, #f8fafc, #e2e8f0)' },
    { value: 'dark', label: 'Dark', color: 'linear-gradient(135deg, #0f172a, #334155)' },
    { value: 'blue', label: 'Ocean', color: 'linear-gradient(135deg, #bfdbfe, #60a5fa)' },
    { value: 'green', label: 'Forest', color: 'linear-gradient(135deg, #bbf7d0, #34d399)' },
  ];

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
              <button onClick={() => setIsOpen(false)} className="profile-quick-action">
                <Edit3 className="h-4 w-4" />
                <span>Edit profile</span>
              </button>
              <button onClick={handlePreferences} className="profile-quick-action">
                <Settings className="h-4 w-4" />
                <span>Preferences</span>
              </button>
              <button onClick={() => setIsOpen(false)} className="profile-quick-action">
                <Shield className="h-4 w-4" />
                <span>Privacy</span>
              </button>
            </div>

            <div className="profile-theme-section">
              <div className="profile-section-title">
                <Palette className="h-4 w-4" />
                <span>Theme mood</span>
              </div>
              <div className="profile-theme-grid">
                {themeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTheme(option.value)}
                    className={`profile-theme-chip ${
                      theme === option.value ? 'profile-theme-chip-active' : ''
                    }`}
                  >
                    <span
                      className="profile-theme-swatch"
                      style={{ background: option.color }}
                      aria-hidden="true"
                    />
                    <span>{option.label}</span>
                    {theme === option.value ? <Check className="h-3.5 w-3.5" /> : null}
                  </button>
                ))}
              </div>
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
    </>
  );
};

export default ProfileDropdown;
