import React, { useState } from 'react';
import { BookOpen, BarChart3, Home, RefreshCw } from 'lucide-react';
import JournalEntry from './components/JournalEntry';
import Dashboard from './components/Dashboard';
import RecentEntries from './components/RecentEntries';
import ProfileDropdown from './components/Profile/ProfileDropdown';
import { JournalEntry as JournalEntryType } from './types';
import { useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import LoginForm from './components/Auth/LoginForm';
import SignupForm from './components/Auth/SignupForm';
import { auth } from './lib/supabase';
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
    // Refresh dashboard data
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

  const handleForceRefresh = async () => {
    try {
      await auth.forceRefresh();
    } catch (error) {
      console.error('Error force refreshing:', error);
    }
  };

  const tabs = [
    { id: 'write' as TabType, label: 'Write', icon: BookOpen },
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: BarChart3 },
    { id: 'entries' as TabType, label: 'Entries', icon: Home },
  ];

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show authentication forms if not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Eunoia Journal</h2>
            <p className="mt-2 text-sm text-gray-600">
              {authMode === 'login' ? 'Sign in to your account' : 'Create your account'}
            </p>
          </div>
          
          <div className="bg-white py-8 px-6 shadow rounded-lg">
            {authMode === 'login' ? (
              <LoginForm onToggleMode={() => setAuthMode('signup')} />
            ) : (
              <SignupForm onToggleMode={() => setAuthMode('login')} />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Eunoia Journal</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                title="Refresh data"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
              <button
                onClick={handleForceRefresh}
                className="px-3 py-1 text-xs bg-yellow-500 text-white hover:bg-yellow-600 rounded-md transition-colors"
                title="Force refresh auth (debug)"
              >
                Force Auth
              </button>
              <ProfileDropdown onSignOut={handleSignOut} />
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'write' && (
          <div className="max-w-4xl mx-auto">
            <JournalEntry onEntrySaved={handleEntrySaved} />
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="max-w-7xl mx-auto">
            <Dashboard key={refreshKey} />
          </div>
        )}

        {activeTab === 'entries' && (
          <div className="max-w-4xl mx-auto">
            <RecentEntries key={refreshKey} newEntries={entries} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-600">
            <p className="mb-2">
              <strong>Eunoia Journal</strong> - AI-powered mood tracking and reflection
            </p>
            <p className="text-xs">
              This is a prototype application. Please do not share sensitive personal information.
              AI analysis is not a substitute for professional medical or mental health advice.
            </p>
          </div>
        </div>
      </footer>
      </div>
    </ThemeProvider>
  );
}

export default App;
