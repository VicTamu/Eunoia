import React, { useState, useEffect } from 'react';
import { BookOpen, BarChart3, Home, RefreshCw } from 'lucide-react';
import JournalEntry from './components/JournalEntry';
import Dashboard from './components/Dashboard';
import RecentEntries from './components/RecentEntries';
import { JournalEntry as JournalEntryType } from './types';
import './App.css';

type TabType = 'write' | 'dashboard' | 'entries';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('write');
  const [entries, setEntries] = useState<JournalEntryType[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEntrySaved = (newEntry: JournalEntryType) => {
    setEntries(prev => [newEntry, ...prev]);
    // Refresh dashboard data
    setRefreshKey(prev => prev + 1);
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const tabs = [
    { id: 'write' as TabType, label: 'Write', icon: BookOpen },
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: BarChart3 },
    { id: 'entries' as TabType, label: 'Entries', icon: Home },
  ];

  return (
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
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              title="Refresh data"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
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
  );
}

export default App;
