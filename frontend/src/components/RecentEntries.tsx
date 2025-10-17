import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, Calendar, Heart, Brain } from 'lucide-react';
import { journalApi } from '../services/api';
import { JournalEntry } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface RecentEntriesProps {
  newEntries?: JournalEntry[];
}

const RecentEntries: React.FC<RecentEntriesProps> = ({ newEntries = [] }) => {
  const [fetchedEntries, setFetchedEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, session, loading: authLoading } = useAuth();

  // Placeholder sample entries shown when there is no data yet
  const SAMPLE_ENTRIES: JournalEntry[] = useMemo(() => {
    const now = new Date();
    const iso = (d: Date) => d.toISOString();
    const daysAgo = (n: number) => {
      const d = new Date(now);
      d.setDate(d.getDate() - n);
      return d;
    };
    return [
      {
        id: -1,
        date: iso(daysAgo(0)),
        created_at: iso(daysAgo(0)),
        updated_at: iso(daysAgo(0)),
        content: 'Took a long walk today and felt surprisingly relaxed. Grateful for the sunshine.',
        sentiment_score: 0.6,
        emotion: 'joy',
        stress_level: 0.2,
      },
      {
        id: -2,
        date: iso(daysAgo(1)),
        created_at: iso(daysAgo(1)),
        updated_at: iso(daysAgo(1)),
        content: 'Work was hectic with tight deadlines, but I managed to complete the tasks.',
        sentiment_score: 0.1,
        emotion: 'nervousness',
        stress_level: 0.6,
      },
      {
        id: -3,
        date: iso(daysAgo(2)),
        created_at: iso(daysAgo(2)),
        updated_at: iso(daysAgo(2)),
        content: 'Felt a bit down earlier, but a chat with a friend helped a lot.',
        sentiment_score: -0.1,
        emotion: 'sadness',
        stress_level: 0.4,
      },
    ];
  }, []);

  useEffect(() => {
    // Only load data when user is authenticated and session is available
    if (user && session && !authLoading) {
      loadEntries();
    }
  }, [user, session, authLoading]);

  const loadEntries = async () => {
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      console.log('Loading entries...');
      const data = await journalApi.getEntries(1, 10); // Page 1, 10 per page
      console.log('Loaded entries:', data);
      setFetchedEntries(data);
    } catch (err) {
      console.error('Error loading entries:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load recent entries.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Combine newly created entries (optimistic) with fetched ones, avoiding duplicates
  const displayEntries = useMemo(() => {
    // If there's an error, don't show sample data - show the error
    if (error) return [];

    // If we have fetched entries, use them (with new entries if any)
    if (fetchedEntries.length > 0) {
      if (!newEntries || newEntries.length === 0) return fetchedEntries;
      const newIds = new Set(newEntries.map((e) => e.id));
      const filteredFetched = fetchedEntries.filter((e) => !newIds.has(e.id));
      return [...newEntries, ...filteredFetched];
    }

    // If we have new entries but no fetched ones yet, show new entries
    if (newEntries && newEntries.length > 0) return newEntries;

    // Only show sample data if we have no error, no fetched entries, and no new entries
    return SAMPLE_ENTRIES;
  }, [newEntries, fetchedEntries, SAMPLE_ENTRIES, error]);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Unknown date';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'Unknown date';
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSentimentEmoji = (score: number | null) => {
    if (score === null) return '😐';
    if (score > 0.3) return '😊';
    if (score < -0.3) return '😔';
    return '😐';
  };

  const getEmotionEmoji = (emotion: string | null) => {
    const emotionMap: { [key: string]: string } = {
      joy: '😊',
      sadness: '😢',
      anger: '😠',
      fear: '😨',
      surprise: '😲',
      disgust: '🤢',
      neutral: '😐',
      love: '😍',
      anxiety: '😰',
      excitement: '🤩',
    };
    return emotionMap[emotion?.toLowerCase() || 'neutral'] || '😐';
  };

  const getStressLevel = (level: number | null) => {
    if (level === null) return 'Unknown';
    if (level > 0.7) return 'High';
    if (level > 0.4) return 'Medium';
    return 'Low';
  };

  const getStressColor = (level: number | null) => {
    if (level === null) return 'text-gray-500';
    if (level > 0.7) return 'text-red-600';
    if (level > 0.4) return 'text-yellow-600';
    return 'text-green-600';
  };

  // Show loading if auth is still loading or data is loading
  if (authLoading || loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Entries</h2>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading entries</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
                <button
                  onClick={loadEntries}
                  className="mt-2 text-red-600 hover:text-red-500 font-medium"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (displayEntries.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center text-gray-600">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">No Entries Yet</h3>
          <p>Start writing your first journal entry to see it here!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="h-5 w-5 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-800">Recent Entries</h2>
      </div>

      <div className="space-y-4">
        {displayEntries.map((entry) => (
          <div
            key={entry.id}
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(entry.date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">{getSentimentEmoji(entry.sentiment_score)}</span>
                <span className="text-lg">{getEmotionEmoji(entry.emotion)}</span>
              </div>
            </div>

            <p className="text-gray-800 mb-3 line-clamp-3">
              {(() => {
                const text = entry.content || '';
                return text.length > 150 ? `${text.substring(0, 150)}...` : text;
              })()}
            </p>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Brain className="h-4 w-4 text-purple-600" />
                  <span className="text-gray-600">
                    Mood:{' '}
                    {entry.sentiment_score !== null ? entry.sentiment_score.toFixed(2) : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="h-4 w-4 text-red-600" />
                  <span className={`${getStressColor(entry.stress_level)}`}>
                    Stress: {getStressLevel(entry.stress_level)}
                  </span>
                </div>
              </div>
              <div className="text-gray-500">{entry.emotion || 'neutral'}</div>
            </div>
          </div>
        ))}
      </div>

      {displayEntries.length >= 10 && (
        <div className="mt-4 text-center">
          <button
            onClick={loadEntries}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Load More Entries
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentEntries;
