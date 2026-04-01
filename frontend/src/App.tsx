import React, { useState } from 'react';
import { BookOpen, BarChart3, Home, RefreshCw, Sparkles, ShieldCheck } from 'lucide-react';
import JournalEntry from './components/JournalEntry';
import Dashboard from './components/Dashboard';
import RecentEntries from './components/RecentEntries';
import ProfileDropdown from './components/Profile/ProfileDropdown';
import { JournalEntry as JournalEntryType } from './types';
import { useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import LoginForm from './components/Auth/LoginForm';
import SignupForm from './components/Auth/SignupForm';
import './App.css';

type TabType = 'write' | 'dashboard' | 'entries';
type AuthMode = 'login' | 'signup';

function App() {
  const { user, loading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('write');
  const [entries, setEntries] = useState<JournalEntryType[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  const handleEntrySaved = (newEntry: JournalEntryType) => {
    setEntries((prev) => [newEntry, ...prev]);
    setRefreshKey((prev) => prev + 1);
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setEntries([]);
      setRefreshKey(0);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const tabs = [
    { id: 'write' as TabType, label: 'Write', icon: BookOpen },
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: BarChart3 },
    { id: 'entries' as TabType, label: 'Entries', icon: Home },
  ];

  if (loading) {
    return (
      <div className="app-shell flex items-center justify-center">
        <div className="text-center panel-card p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your reflection space...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-shell">
        <section className="auth-story">
          <div>
            <div className="eyebrow">
              <Sparkles className="h-4 w-4" />
              Eunoia Journal
            </div>
            <h1>A more human way to track how you really feel.</h1>
            <p>
              Capture the texture of your day, notice emotional patterns over time, and get calm,
              readable insights without turning journaling into a chore.
            </p>

            <div className="auth-notes">
              <div className="auth-note">
                <strong>Gentle daily writing</strong>
                <span>
                  Low-friction prompts, clean writing space, and support for quick check-ins.
                </span>
              </div>
              <div className="auth-note">
                <strong>Useful emotional trends</strong>
                <span>
                  Understand mood, stress, and recurring themes without drowning in charts.
                </span>
              </div>
              <div className="auth-note">
                <strong>Privacy-aware by design</strong>
                <span>
                  Your journal is personal. Eunoia keeps that front and center in the experience.
                </span>
              </div>
            </div>
          </div>

          <div className="muted-copy">
            Reflect with a little more honesty. Notice yourself with a little more grace.
          </div>
        </section>

        <section className="auth-card-shell">
          <div className="auth-card">
            <div className="auth-mini-brand">
              <span className="auth-mini-brand-mark">
                <BookOpen className="h-6 w-6" />
              </span>
              <div>
                <strong className="text-gray-900">Eunoia</strong>
                <div className="muted-copy text-sm">
                  {authMode === 'login' ? 'Welcome back' : 'Create your account'}
                </div>
              </div>
            </div>

            <div className="mt-4">
              {authMode === 'login' ? (
                <LoginForm onToggleMode={() => setAuthMode('signup')} />
              ) : (
                <SignupForm onToggleMode={() => setAuthMode('login')} />
              )}
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <div className="app-shell bg-aurora">
        <div className="app-frame">
          <section className="hero-card">
            <div className="hero-copy">
              <div className="eyebrow">
                <ShieldCheck className="h-4 w-4" />
                Private reflection space
              </div>
              <h1 className="hero-title">A calmer place to write, notice, and understand.</h1>
              <p className="hero-lead">
                Eunoia turns daily journaling into a gentle rhythm. Write freely, revisit old
                entries, and surface emotional patterns without losing the warmth of the habit.
              </p>
            </div>
          </section>

          <div className="workspace-bar">
            <div className="tabs-shell workspace-nav">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`tab-pill ${isActive ? 'tab-pill-active' : ''}`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="toolbar-actions workspace-utilities">
              <button onClick={handleRefresh} className="refresh-action" title="Refresh data">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
              <ProfileDropdown onSignOut={handleSignOut} />
            </div>
          </div>

          <main className="page-stage">
            {activeTab === 'write' && <JournalEntry onEntrySaved={handleEntrySaved} />}
            {activeTab === 'dashboard' && <Dashboard key={refreshKey} />}
            {activeTab === 'entries' && <RecentEntries key={refreshKey} newEntries={entries} />}
          </main>

          <footer className="footer-card">
            <div className="text-sm text-gray-600">
              <p className="mb-2">
                <strong>Eunoia Journal</strong> is designed to make reflection feel calmer, clearer,
                and easier to sustain.
              </p>
              <p className="text-xs">
                This is a prototype application. Please do not share sensitive personal information.
                AI analysis is supportive context, not medical advice.
              </p>
            </div>
          </footer>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
