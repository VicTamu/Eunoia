import React, { useMemo, useState } from 'react';
import { AlertCircle, BookOpen, Brain, Heart, PenSquare, Search, Sparkles, X } from 'lucide-react';
import { JournalEntry } from '../types';

interface RecentEntriesProps {
  entries: JournalEntry[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  onStartWriting?: () => void;
}

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'Unknown date';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Unknown date';
  const datePart = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timePart = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return `${datePart} \u00b7 ${timePart}`;
};

const formatEntryTimestamp = (entry: JournalEntry) =>
  formatDate(entry.created_at || entry.date || entry.updated_at);

const RecentEntries: React.FC<RecentEntriesProps> = ({
  entries,
  loading = false,
  error = '',
  onRetry,
  onStartWriting,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [emotionFilter, setEmotionFilter] = useState('all');
  const [expandedEntries, setExpandedEntries] = useState<number[]>([]);

  const getVisibleEmotion = (entry: JournalEntry) =>
    (entry.emotion && entry.emotion.toLowerCase() !== 'neutral'
      ? entry.emotion
      : entry.emotions_detected?.[0]?.[0]) || 'neutral';

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

  const getEntryTone = (score: number | null) => {
    const mood = getMoodLabel(score);
    if (mood === 'Positive') return 'entry-card-positive';
    if (mood === 'Negative') return 'entry-card-negative';
    return 'entry-card-neutral';
  };

  const emotionOptions = useMemo(
    () =>
      Array.from(new Set(entries.map((entry) => getVisibleEmotion(entry)).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b),
      ),
    [entries],
  );

  const visibleEntries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return entries.filter((entry) => {
      const emotion = getVisibleEmotion(entry).toLowerCase();
      const matchesEmotion = emotionFilter === 'all' || emotion === emotionFilter.toLowerCase();
      const matchesQuery =
        !query ||
        entry.content.toLowerCase().includes(query) ||
        emotion.includes(query) ||
        formatEntryTimestamp(entry).toLowerCase().includes(query);

      return matchesEmotion && matchesQuery;
    });
  }, [entries, emotionFilter, searchQuery]);

  const toggleExpanded = (entryId: number) => {
    setExpandedEntries((current) =>
      current.includes(entryId) ? current.filter((id) => id !== entryId) : [...current, entryId],
    );
  };

  if (loading) {
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
      <div className="soft-empty">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold">We could not load your entries</h3>
        <p>{error}</p>
        {onRetry ? (
          <button type="button" className="soft-empty-action" onClick={onRetry}>
            Try again
          </button>
        ) : null}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="soft-empty">
        <div className="soft-empty-illustration" aria-hidden>
          <BookOpen className="h-5 w-5" />
          <Sparkles className="h-5 w-5" />
          <Heart className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-semibold">Your entries will gather here</h3>
        <p>
          Start with one reflection. The timeline will stay gentle, searchable, and easy to return
          to.
        </p>
        {onStartWriting ? (
          <button type="button" className="soft-empty-action" onClick={onStartWriting}>
            <PenSquare className="h-4 w-4" />
            Write your first entry
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="panel-card entries-card">
      <div className="section-heading">
        <div>
          <div className="eyebrow">
            <Sparkles className="h-4 w-4" />
            Entries
          </div>
          <h2 className="section-title mt-4">A readable timeline of how you&apos;ve been doing</h2>
          <p className="muted-copy mt-2">
            Showing all {entries.length} saved entr{entries.length === 1 ? 'y' : 'ies'} so your
            timeline and dashboard stay in sync.
          </p>
        </div>
      </div>

      <div className="entries-filter-row">
        <label
          className={`entries-search-shell ${searchQuery ? 'entries-search-shell-active' : ''}`}
        >
          <Search className="h-4 w-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search entries or feelings"
            className="entries-search-input"
          />
          {searchQuery ? (
            <button
              type="button"
              className="entries-search-clear"
              onClick={() => setSearchQuery('')}
              aria-label="Clear entry search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </label>

        <select
          value={emotionFilter}
          onChange={(event) => setEmotionFilter(event.target.value)}
          className="entries-filter-select"
        >
          <option value="all">All emotions</option>
          {emotionOptions.map((emotion) => (
            <option key={emotion} value={emotion}>
              {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {visibleEntries.length === 0 ? (
        <div className="soft-empty">
          <Brain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold">No entries match that view yet</h3>
          <p>Try a different search or emotion filter to widen the timeline.</p>
        </div>
      ) : null}

      <div className="entries-list">
        {visibleEntries.map((entry) => {
          const visibleEmotion = getVisibleEmotion(entry);
          const preview = entry.content || '';
          const isExpanded = expandedEntries.includes(entry.id);
          const shouldTruncate = preview.length > 190;
          const previewText =
            shouldTruncate && !isExpanded ? `${preview.substring(0, 190).trim()}...` : preview;
          const roundedMood =
            entry.sentiment_score !== null ? Math.round(entry.sentiment_score) : null;
          const roundedStress = entry.stress_level !== null ? Math.round(entry.stress_level) : null;

          return (
            <article
              key={entry.id}
              className={`entry-card ${getEntryTone(entry.sentiment_score)} ${
                isExpanded ? 'entry-card-expanded' : ''
              }`}
            >
              <div className="entry-header">
                <div className="entry-header-main">
                  <div className="entry-meta">
                    <span className="entry-meta-text">{formatEntryTimestamp(entry)}</span>
                  </div>
                  <div className="entry-emotion-hero">
                    <span className="entry-emotion-pill">{visibleEmotion}</span>
                    <span className="entry-tone-subtitle">
                      {`${getMoodLabel(entry.sentiment_score)} mood \u00b7 ${getStressLabel(
                        entry.stress_level,
                      )} stress`}
                    </span>
                  </div>
                </div>
                <div className="entry-badges">
                  <span className="entry-badge entry-badge-soft">
                    <span
                      className="entry-status-dot"
                      style={{ backgroundColor: getMoodIconColor(entry.sentiment_score) }}
                    />
                    {getMoodLabel(entry.sentiment_score)}
                  </span>
                  <span className="entry-badge entry-badge-soft">
                    <span
                      className="entry-status-dot"
                      style={{ backgroundColor: getStressIconColor(entry.stress_level) }}
                    />
                    {getStressLabel(entry.stress_level)}
                  </span>
                </div>
              </div>

              <p className={`entry-preview ${!isExpanded ? 'line-clamp-2' : ''}`}>{previewText}</p>
              {shouldTruncate ? (
                <button
                  type="button"
                  className="entry-expand-button"
                  onClick={() => toggleExpanded(entry.id)}
                >
                  {isExpanded ? 'Show less' : 'Read more'}
                </button>
              ) : null}

              <div className="entry-footer">
                <div className="entry-score-stack">
                  <div className="entry-score-row">
                    <div className="entry-score-label">
                      <Brain
                        className="h-4 w-4"
                        style={{ color: getMoodIconColor(entry.sentiment_score) }}
                      />
                      Mood
                    </div>
                    <span className="entry-score-value">
                      {roundedMood !== null ? `${roundedMood}/10` : 'N/A'}
                    </span>
                  </div>
                  <div className="entry-score-bar-row">
                    <div className="entry-score-bar" aria-hidden>
                      <span
                        className="entry-score-fill"
                        style={{
                          width: `${((roundedMood ?? 0) / 10) * 100}%`,
                          background: getMoodIconColor(entry.sentiment_score),
                        }}
                      />
                    </div>
                    <span className="entry-score-bar-value">
                      {roundedMood !== null ? `${roundedMood}/10` : 'N/A'}
                    </span>
                  </div>

                  <div className="entry-score-row">
                    <div className="entry-score-label">
                      <Heart
                        className="h-4 w-4"
                        style={{ color: getStressIconColor(entry.stress_level) }}
                      />
                      Stress
                    </div>
                    <span className="entry-score-value">
                      {roundedStress !== null ? `${roundedStress}/10` : 'N/A'}
                    </span>
                  </div>
                  <div className="entry-score-bar-row">
                    <div className="entry-score-bar" aria-hidden>
                      <span
                        className="entry-score-fill"
                        style={{
                          width: `${((roundedStress ?? 0) / 10) * 100}%`,
                          background: getStressIconColor(entry.stress_level),
                        }}
                      />
                    </div>
                    <span className="entry-score-bar-value">
                      {roundedStress !== null ? `${roundedStress}/10` : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="entry-badges">
                  <span className="entry-badge entry-badge-soft">
                    <Brain
                      className="h-4 w-4"
                      style={{ color: getMoodIconColor(entry.sentiment_score) }}
                    />
                    {getMoodLabel(entry.sentiment_score)} mood
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default RecentEntries;
