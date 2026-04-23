import React, { useState, useEffect } from 'react';
import { BookOpen, BarChart3, Home, ShieldCheck } from 'lucide-react';
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
type AuthMode = 'login' | 'signup';
type GuestView = 'landing' | 'auth';

function App() {
  const { user, loading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('write');
  const [entries, setEntries] = useState<JournalEntryType[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [guestView, setGuestView] = useState<GuestView>('landing');
  const [signUpEmailSent, setSignUpEmailSent] = useState(false);
  const [pendingSignupEmail, setPendingSignupEmail] = useState('');

  useEffect(() => {
    if (authMode === 'login') {
      setSignUpEmailSent(false);
      setPendingSignupEmail('');
    }
  }, [authMode]);

  useEffect(() => {
    if (!user || loading) {
      return;
    }

    let isMounted = true;

    const loadEntries = async () => {
      try {
        setEntriesLoading(true);
        const allEntries = await journalApi.getAllEntries();
        if (isMounted) {
          setEntries(allEntries);
        }
      } catch (error) {
        console.error('Error loading entries:', error);
        if (isMounted) {
          setEntries([]);
        }
      } finally {
        if (isMounted) {
          setEntriesLoading(false);
        }
      }
    };

    loadEntries();

    return () => {
      isMounted = false;
    };
  }, [user, loading]);

  const handleEntrySaved = (newEntry: JournalEntryType) => {
    setEntries((prev) => [newEntry, ...prev.filter((entry) => entry.id !== newEntry.id)]);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setEntries([]);
      setEntriesLoading(false);
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

  if (loading) {
    return (
      <div className="guest-loading-shell">
        <AmbientBackground />
        <div className="guest-loading-card">
          <div className="guest-loading-spinner" aria-hidden />
          <p className="guest-loading-text">Loading your reflection space…</p>
        </div>
      </div>
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
        <section className="hero-card">
          <div className="hero-copy">
            <div className="eyebrow">
              <ShieldCheck className="h-4 w-4" />
              Private reflection space
            </div>
            <h1 className="hero-title">A calmer place to write, notice, and understand.</h1>
            <p className="hero-lead">
              Eunoia turns daily journaling into a gentle rhythm. Write freely, revisit old entries,
              and surface emotional patterns without losing the warmth of the habit.
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
            <ProfileDropdown onSignOut={handleSignOut} />
          </div>
        </div>

        <main className="page-stage">
          {activeTab === 'write' && <JournalEntry onEntrySaved={handleEntrySaved} />}
          {activeTab === 'dashboard' && <Dashboard entries={entries} loading={entriesLoading} />}
          {activeTab === 'entries' && <RecentEntries entries={entries} loading={entriesLoading} />}
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
  );
}

export default App;
