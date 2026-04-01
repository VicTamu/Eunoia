import React, { useState } from 'react';
import { X, Bell, Shield, Database, Moon, Sun, Check, Droplets, Leaf, Palette } from 'lucide-react';
import { useTheme, Theme } from '../../contexts/ThemeContext';

interface PreferencesModalProps {
  onClose: () => void;
}

const PreferencesModal: React.FC<PreferencesModalProps> = ({ onClose }) => {
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [analytics, setAnalytics] = useState(true);
  const [autoSave, setAutoSave] = useState(true);

  const themeOptions: {
    value: Theme;
    label: string;
    description: string;
    icon: typeof Sun;
    preview: string;
  }[] = [
    {
      value: 'light',
      label: 'Light',
      description: 'Clean and bright interface',
      icon: Sun,
      preview: 'bg-white border-gray-200',
    },
    {
      value: 'dark',
      label: 'Dark',
      description: 'Easy on the eyes',
      icon: Moon,
      preview: 'bg-gray-900 border-gray-700',
    },
    {
      value: 'blue',
      label: 'Ocean Blue',
      description: 'Calming blue tones',
      icon: Droplets,
      preview: 'bg-blue-50 border-blue-200',
    },
    {
      value: 'green',
      label: 'Forest Green',
      description: 'Natural and peaceful',
      icon: Leaf,
      preview: 'bg-green-50 border-green-200',
    },
  ];

  const handleSave = () => {
    localStorage.setItem('eunoia-notifications', notifications.toString());
    localStorage.setItem('eunoia-analytics', analytics.toString());
    localStorage.setItem('eunoia-autosave', autoSave.toString());
    onClose();
  };

  return (
    <div className="preferences-overlay" onClick={onClose}>
      <div className="preferences-modal panel-card" onClick={(e) => e.stopPropagation()}>
        <div className="preferences-header">
          <div>
            <div className="eyebrow">
              <SettingsIcon />
              Preferences
            </div>
            <h2 className="section-title mt-4">Tune the space around your reflection</h2>
            <p className="section-copy mt-2">
              Adjust the visual mood and a few comfort settings without leaving your writing flow.
            </p>
          </div>
          <button onClick={onClose} className="preferences-close" aria-label="Close preferences">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="preferences-content">
          <section className="preferences-section">
            <div className="preferences-section-heading">
              <Palette className="h-5 w-5" />
              <div>
                <h3>Theme mood</h3>
                <p>Choose the atmosphere that best supports your journaling rhythm.</p>
              </div>
            </div>
            <div className="preferences-theme-grid">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                const isActive = theme === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => setTheme(option.value)}
                    className={`preferences-theme-card ${
                      isActive ? 'preferences-theme-card-active' : ''
                    }`}
                  >
                    <div className="preferences-theme-topline">
                      <div className={`preferences-theme-preview ${option.preview}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      {isActive ? <Check className="h-4 w-4 preferences-theme-check" /> : null}
                    </div>
                    <div className="preferences-theme-label">{option.label}</div>
                    <div className="preferences-theme-description">{option.description}</div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="preferences-grid">
            <div className="preferences-setting-card">
              <div className="preferences-section-heading">
                <Bell className="h-5 w-5" />
                <div>
                  <h3>Notifications</h3>
                  <p>Keep gentle reminders and insight emails in your control.</p>
                </div>
              </div>
              <label className="preferences-toggle-row">
                <div>
                  <span>Email notifications for insights</span>
                  <small>Send occasional prompts and summary emails.</small>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifications((prev) => !prev)}
                  className={`preferences-toggle ${notifications ? 'preferences-toggle-on' : ''}`}
                  aria-pressed={notifications}
                >
                  <span className="preferences-toggle-thumb" />
                </button>
              </label>
            </div>

            <div className="preferences-setting-card">
              <div className="preferences-section-heading">
                <Shield className="h-5 w-5" />
                <div>
                  <h3>Privacy & data</h3>
                  <p>Choose how much usage information you want to contribute.</p>
                </div>
              </div>
              <label className="preferences-toggle-row">
                <div>
                  <span>Allow analytics to improve the app</span>
                  <small>Helps identify bugs and improve the journaling experience.</small>
                </div>
                <button
                  type="button"
                  onClick={() => setAnalytics((prev) => !prev)}
                  className={`preferences-toggle ${analytics ? 'preferences-toggle-on' : ''}`}
                  aria-pressed={analytics}
                >
                  <span className="preferences-toggle-thumb" />
                </button>
              </label>
            </div>

            <div className="preferences-setting-card preferences-setting-card-wide">
              <div className="preferences-section-heading">
                <Database className="h-5 w-5" />
                <div>
                  <h3>Journal settings</h3>
                  <p>Small quality-of-life settings for the writing flow.</p>
                </div>
              </div>
              <label className="preferences-toggle-row">
                <div>
                  <span>Auto-save entries while typing</span>
                  <small>Keep drafts protected while you write.</small>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoSave((prev) => !prev)}
                  className={`preferences-toggle ${autoSave ? 'preferences-toggle-on' : ''}`}
                  aria-pressed={autoSave}
                >
                  <span className="preferences-toggle-thumb" />
                </button>
              </label>
            </div>
          </section>
        </div>

        <div className="preferences-footer">
          <button onClick={onClose} className="preferences-secondary-action">
            Cancel
          </button>
          <button onClick={handleSave} className="primary-action preferences-primary-action">
            Save preferences
          </button>
        </div>
      </div>
    </div>
  );
};

const SettingsIcon = () => (
  <span className="preferences-badge-icon" aria-hidden="true">
    <Palette className="h-4 w-4" />
  </span>
);

export default PreferencesModal;
