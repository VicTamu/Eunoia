import React from 'react';
import { BookOpen, Heart, Brain, Sparkles } from 'lucide-react';
import { JournalEntry } from '../types';

interface RecentEntriesProps {
  entries: JournalEntry[];
  loading?: boolean;
}

const RecentEntries: React.FC<RecentEntriesProps> = ({ entries, loading = false }) => {
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

  if (entries.length === 0) {
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
            Entries
          </div>
          <h2 className="section-title mt-4">A readable timeline of how you&apos;ve been doing</h2>
          <p className="muted-copy mt-2">
            Showing all {entries.length} saved entr{entries.length === 1 ? 'y' : 'ies'} so your
            timeline and dashboard stay in sync.
          </p>
        </div>
      </div>

      <div className="entries-list">
        {entries.map((entry) => {
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
                  <span className="entry-badge">{getEmotionEmoji(visibleEmotion)}</span>
                  <span className="entry-badge">{getMoodLabel(entry.sentiment_score)} mood</span>
                  <span className="entry-badge">{getStressLabel(entry.stress_level)} stress</span>
                </div>
              </div>

              <p className="entry-preview line-clamp-3">{truncatedPreview}</p>

              <div className="entry-footer">
                <div className="entry-badges">
                  <span className="entry-badge">
                    <Brain
                      className="h-4 w-4"
                      style={{ color: getMoodIconColor(entry.sentiment_score) }}
                    />
                    {entry.sentiment_score !== null
                      ? `${entry.sentiment_score.toFixed(1)}/10`
                      : 'N/A'}
                  </span>
                  <span className="entry-badge">
                    <Heart
                      className="h-4 w-4"
                      style={{ color: getStressIconColor(entry.stress_level) }}
                    />
                    {getStressLabel(entry.stress_level)}
                  </span>
                </div>
                <div className="entry-emotion">{visibleEmotion}</div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default RecentEntries;
