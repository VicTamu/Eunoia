import React, { useCallback, useEffect, useState } from 'react';
import { BarChart3, BookOpen, Brain, Clock, Home, PenSquare, Sparkles, Sun, X } from 'lucide-react';
import JournalEntry from './components/JournalEntry';
import Dashboard from './components/Dashboard';
import RecentEntries from './components/RecentEntries';
import ProfileDropdown from './components/Profile/ProfileDropdown';
import { JournalEntry as JournalEntryType } from './types';
import { useAuth } from './contexts/AuthContext';
import AmbientBackground from './components/AmbientBackground';
import AuthScreen from './components/Auth/AuthScreen';
import LandingPage from './components/LandingPage';
import { journalApi } from './services/api';
import './App.css';

type TabType = 'write' | 'dashboard' | 'entries';
type AuthMode = 'login' | 'signup' | 'recovery';
type GuestView = 'landing' | 'auth';

function App() {
  const { user, loading, signOut, isPasswordRecovery } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('write');
  const [entries, setEntries] = useState<JournalEntryType[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [entriesLoaded, setEntriesLoaded] = useState(false);
  const [entriesError, setEntriesError] = useState('');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [guestView, setGuestView] = useState<GuestView>('landing');
  const [signUpEmailSent, setSignUpEmailSent] = useState(false);
  const [pendingSignupEmail, setPendingSignupEmail] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (authMode === 'login') {
      setSignUpEmailSent(false);
      setPendingSignupEmail('');
    }
  }, [authMode]);

  const loadEntries = useCallback(async () => {
    try {
      setEntriesLoading(true);
      setEntriesLoaded(false);
      setEntriesError('');
      const allEntries = await journalApi.getAllEntries();
      setEntries(allEntries);
    } catch (error) {
      console.error('Error loading entries:', error);
      setEntriesError("We couldn't load your saved entries right now. Try again in a moment.");
    } finally {
      setEntriesLoading(false);
      setEntriesLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!user || loading || isPasswordRecovery) {
      return;
    }

    void loadEntries();
  }, [user, loading, isPasswordRecovery, loadEntries]);

  const handleEntrySaved = (newEntry: JournalEntryType) => {
    setEntries((prev) => [newEntry, ...prev.filter((entry) => entry.id !== newEntry.id)]);
    setShowWelcome(false);
  };

  useEffect(() => {
    if (!user || !entriesLoaded || entriesLoading || entriesError || entries.length > 0) {
      setShowWelcome(false);
      return;
    }

    const dismissedKey = `eunoia-welcome-dismissed:${user.id}`;
    setShowWelcome(localStorage.getItem(dismissedKey) !== 'true');
  }, [entries.length, entriesError, entriesLoaded, entriesLoading, user]);

  const dismissWelcome = () => {
    if (user) {
      localStorage.setItem(`eunoia-welcome-dismissed:${user.id}`, 'true');
    }
    setShowWelcome(false);
  };

  const startWritingFromWelcome = () => {
    dismissWelcome();
    setActiveTab('write');
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setEntries([]);
      setEntriesLoading(false);
      setEntriesLoaded(false);
      setEntriesError('');
      setShowWelcome(false);
      setGuestView('landing');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const tabs = [
    { id: 'write' as TabType, label: 'Write', icon: BookOpen },
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: BarChart3 },
    { id: 'entries' as TabType, label: 'Entries', icon: Home },
  ];

  const metadataName =
    user?.user_metadata?.display_name?.split(' ')[0] ||
    user?.user_metadata?.full_name?.split(' ')[0];
  const safeFirstName =
    metadataName && /^[A-Za-z][A-Za-z' -]{1,24}$/.test(metadataName) ? metadataName : '';

  const timeOfDay = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  })();
  const timeOfDayLabel = timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1);

  const formattedToday = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  const heroCopy =
    activeTab === 'write'
      ? {
          eyebrow: `${formattedToday} · ${timeOfDayLabel}`,
          title: safeFirstName ? `Good ${timeOfDay}, ${safeFirstName}.` : `Good ${timeOfDay}.`,
          lead: 'Reflect with a little more honesty. Notice yourself with a little more grace.',
        }
      : activeTab === 'dashboard'
        ? {
            eyebrow: 'Patterns \u00b7 Gently gathered',
            title: safeFirstName ? `Good ${timeOfDay}, ${safeFirstName}.` : `Good ${timeOfDay}.`,
            lead: 'This is where your recent reflections start turning into something readable, warm, and a little more useful.',
          }
        : {
            eyebrow: 'Reflection timeline',
            title: safeFirstName ? `Good ${timeOfDay}, ${safeFirstName}.` : `Good ${timeOfDay}.`,
            lead: 'Revisit what you have been carrying, noticing, and moving through without losing the human texture of the writing.',
          };
  const HeroSignalIcon =
    activeTab === 'write' ? Sun : activeTab === 'dashboard' ? BarChart3 : Clock;

  if (loading) {
    return (
      <div className="guest-loading-shell">
        <AmbientBackground />
        <div className="guest-loading-card">
          <div className="guest-loading-spinner" aria-hidden />
          <p className="guest-loading-text">Loading your reflection space...</p>
        </div>
      </div>
    );
  }

  if (isPasswordRecovery) {
    return (
      <AuthScreen
        mode="recovery"
        onModeChange={setAuthMode}
        signUpEmailSent={false}
        pendingSignupEmail=""
        onRegistered={() => undefined}
        onBackToLanding={() => setGuestView('landing')}
      />
    );
  }

  if (!user) {
    if (guestView === 'landing') {
      return (
        <LandingPage
          onSignIn={() => {
            setAuthMode('login');
            setGuestView('auth');
          }}
          onSignUp={() => {
            setAuthMode('signup');
            setGuestView('auth');
          }}
        />
      );
    }

    return (
      <AuthScreen
        mode={authMode}
        onModeChange={setAuthMode}
        signUpEmailSent={signUpEmailSent}
        pendingSignupEmail={pendingSignupEmail}
        onRegistered={(email) => {
          setPendingSignupEmail(email);
          setSignUpEmailSent(true);
        }}
        onBackToLanding={() => setGuestView('landing')}
      />
    );
  }

  return (
    <div className="app-shell">
      <AmbientBackground />
      <div className="app-frame">
        <section className="hero-card hero-card-personal">
          <div className="hero-copy">
            <div className="eyebrow conversion-chip hero-date-chip">
              <HeroSignalIcon className="h-4 w-4" />
              {heroCopy.eyebrow}
            </div>
            <h1 className="hero-title greeting-gradient">{heroCopy.title}</h1>
            <p className="hero-lead">{heroCopy.lead}</p>
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
            <ProfileDropdown onSignOut={handleSignOut} />
          </div>
        </div>

        <main className="page-stage">
          {activeTab === 'write' && (
            <JournalEntry entries={entries} onEntrySaved={handleEntrySaved} />
          )}
          {activeTab === 'dashboard' && (
            <Dashboard
              entries={entries}
              loading={entriesLoading}
              error={entriesError}
              onRetry={loadEntries}
              onStartWriting={() => setActiveTab('write')}
            />
          )}
          {activeTab === 'entries' && (
            <RecentEntries
              entries={entries}
              loading={entriesLoading}
              error={entriesError}
              onRetry={loadEntries}
              onStartWriting={() => setActiveTab('write')}
            />
          )}
        </main>

        {showWelcome ? (
          <div className="onboarding-overlay" role="presentation">
            <section
              className="panel-card onboarding-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="onboarding-title"
            >
              <button
                type="button"
                className="onboarding-close"
                onClick={dismissWelcome}
                aria-label="Dismiss welcome"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="eyebrow">
                <Sparkles className="h-4 w-4" />
                Welcome to Eunoia
              </div>
              <h2 id="onboarding-title" className="onboarding-title">
                A softer way to notice what keeps returning.
              </h2>
              <div className="onboarding-steps">
                <article>
                  <span>
                    <PenSquare className="h-4 w-4" />
                  </span>
                  <strong>Write</strong>
                  <p>A few honest sentences is enough to begin.</p>
                </article>
                <article>
                  <span>
                    <Brain className="h-4 w-4" />
                  </span>
                  <strong>Find patterns</strong>
                  <p>Eunoia quietly tracks mood, stress, and tone.</p>
                </article>
                <article>
                  <span>
                    <BarChart3 className="h-4 w-4" />
                  </span>
                  <strong>Revisit insights</strong>
                  <p>Your dashboard grows more useful as entries collect.</p>
                </article>
              </div>
              <div className="onboarding-actions">
                <button
                  type="button"
                  className="dashboard-nudge-button"
                  onClick={startWritingFromWelcome}
                >
                  <PenSquare className="h-4 w-4" />
                  Write your first entry
                </button>
                <button type="button" className="onboarding-secondary" onClick={dismissWelcome}>
                  Maybe later
                </button>
              </div>
            </section>
          </div>
        ) : null}

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
  );
}

export default App;
