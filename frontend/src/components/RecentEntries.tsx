import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, Heart, Brain, Sparkles } from 'lucide-react';
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
        sentiment_score: 8.2,
        emotion: 'joy',
        stress_level: 2.0,
      },
      {
        id: -2,
        date: iso(daysAgo(1)),
        created_at: iso(daysAgo(1)),
        updated_at: iso(daysAgo(1)),
        content: 'Work was hectic with tight deadlines, but I managed to complete the tasks.',
        sentiment_score: 5.2,
        emotion: 'nervousness',
        stress_level: 6.5,
      },
      {
        id: -3,
        date: iso(daysAgo(2)),
        created_at: iso(daysAgo(2)),
        updated_at: iso(daysAgo(2)),
        content: 'Felt a bit down earlier, but a chat with a friend helped a lot.',
        sentiment_score: 4.0,
        emotion: 'sadness',
        stress_level: 4.0,
      },
    ];
  }, []);

  useEffect(() => {
    if (user && session && !authLoading) {
      loadEntries();
    }
  }, [user, session, authLoading]);

  const loadEntries = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await journalApi.getEntries(1, 10);
      setFetchedEntries(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load recent entries.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const displayEntries = useMemo(() => {
    if (error) return [];

    if (fetchedEntries.length > 0) {
      if (!newEntries || newEntries.length === 0) return fetchedEntries;
      const newIds = new Set(newEntries.map((entry) => entry.id));
      const filteredFetched = fetchedEntries.filter((entry) => !newIds.has(entry.id));
      return [...newEntries, ...filteredFetched];
    }

    if (newEntries && newEntries.length > 0) return newEntries;

    return SAMPLE_ENTRIES;
  }, [newEntries, fetchedEntries, SAMPLE_ENTRIES, error]);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Unknown date';
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
      nervousness: '😬',
    };
    return emotionMap[emotion?.toLowerCase() || 'neutral'] || '😐';
  };

  const getStressLabel = (level: number | null) => {
    if (level === null) return 'Unknown';
    if (level > 7) return 'High';
    if (level > 4) return 'Medium';
    return 'Low';
  };

  const getMoodLabel = (score: number | null) => {
    if (score === null) return 'Unknown';
    if (score >= 7) return 'Positive';
    if (score <= 3) return 'Negative';
    return 'Neutral';
  };

  const getMoodIconColor = (score: number | null) => {
    const mood = getMoodLabel(score);
    if (mood === 'Negative') return '#eab308';
    if (mood === 'Positive') return 'var(--icon-accent)';
    return '#64748b';
  };

  const getStressIconColor = (level: number | null) => {
    const stress = getStressLabel(level);
    if (stress === 'Low') return '#16a34a';
    if (stress === 'High') return '#ef4444';
    if (stress === 'Medium') return '#f97316';
    return 'var(--icon-heart)';
  };

  if (authLoading || loading) {
    return (
      <div className="panel-card entries-card">
        <div className="flex items-center justify-center h-32">
          <div
            className="animate-spin rounded-full h-6 w-6 border-b-2"
            style={{ borderColor: 'transparent', borderBottomColor: 'var(--icon-accent)' }}
          ></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel-card entries-card">
        <div className="section-heading">
          <div>
            <div className="eyebrow">
              <BookOpen className="h-4 w-4" />
              Recent writing
            </div>
            <h2 className="section-title mt-4">We couldn&apos;t load your entries</h2>
          </div>
        </div>
        <div className="status-banner status-banner-error">
          {error}
          <div className="mt-2">
            <button onClick={loadEntries} className="text-red-700 font-semibold">
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (displayEntries.length === 0) {
    return (
      <div className="soft-empty">
        <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold">No entries yet</h3>
        <p>Start writing your first journal entry and it will appear here.</p>
      </div>
    );
  }

  return (
    <div className="panel-card entries-card">
      <div className="section-heading">
        <div>
          <div className="eyebrow">
            <Sparkles className="h-4 w-4" />
            Recent writing
          </div>
          <h2 className="section-title mt-4">A readable timeline of how you&apos;ve been doing</h2>
          <p className="muted-copy mt-2">
            Scan recent reflections, emotional tone, and stress at a glance without losing the human
            texture of what you wrote.
          </p>
        </div>
      </div>

      <div className="entries-list">
        {displayEntries.map((entry) => {
          const visibleEmotion =
            (entry.emotion && entry.emotion.toLowerCase() !== 'neutral'
              ? entry.emotion
              : entry.emotions_detected?.[0]?.[0]) || 'neutral';

          const preview = entry.content || '';
          const truncatedPreview =
            preview.length > 200 ? `${preview.substring(0, 200)}...` : preview;

          return (
            <article key={entry.id} className="entry-card">
              <div className="entry-header">
                <div className="entry-meta">
                  <span className="entry-meta-text">{formatDate(entry.date)}</span>
                </div>
                <div className="entry-badges">
                  <span className="entry-badge">{getEmotionEmoji(entry.emotion)}</span>
                  <span className="entry-badge">{getMoodLabel(entry.sentiment_score)} mood</span>
                  <span className="entry-badge">{getStressLabel(entry.stress_level)} stress</span>
                </div>
              </div>

              <p className="entry-preview line-clamp-3">{truncatedPreview}</p>

              <div className="entry-footer">
                <div className="entry-badges">
                  <span className="entry-badge">
                    <Brain className="h-4 w-4" style={{ color: getMoodIconColor(entry.sentiment_score) }} />
                    {entry.sentiment_score !== null
                      ? `${entry.sentiment_score.toFixed(1)}/10`
                      : 'N/A'}
                  </span>
                  <span className="entry-badge">
                    <Heart className="h-4 w-4" style={{ color: getStressIconColor(entry.stress_level) }} />
                    {getStressLabel(entry.stress_level)}
                  </span>
                </div>
                <div className="entry-emotion">{visibleEmotion}</div>
              </div>
            </article>
          );
        })}
      </div>

      {displayEntries.length >= 10 && (
        <div className="mt-4 text-center">
          <button onClick={loadEntries} className="refresh-action">
            Load more entries
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentEntries;
