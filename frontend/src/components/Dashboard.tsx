import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { TrendingUp, Brain, Heart, Calendar, AlertCircle } from 'lucide-react';
import { Insight, JournalEntry as JournalEntryType, SentimentTrend } from '../types';

interface DashboardProps {
  entries: JournalEntryType[];
  loading?: boolean;
}

type InsightSummary = Insight & {
  entry_count: number;
  timeframe_label: string;
};

const getDateKey = (entry: JournalEntryType) => {
  const rawDate = entry.date || entry.created_at || entry.updated_at;
  return rawDate?.split('T')[0] || new Date().toISOString().split('T')[0];
};

const getVisibleEmotion = (entry: JournalEntryType) =>
  (entry.emotion && entry.emotion.toLowerCase() !== 'neutral'
    ? entry.emotion
    : entry.emotions_detected?.[0]?.[0]) || 'neutral';

const getMostCommon = (values: string[]) => {
  if (values.length === 0) {
    return 'neutral';
  }

  const counts = values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
};

const Dashboard: React.FC<DashboardProps> = ({ entries, loading = false }) => {
  const trends = useMemo<SentimentTrend[]>(() => {
    const dailyData = new Map<
      string,
      {
        sentimentScores: number[];
        stressLevels: number[];
        emotions: string[];
        entryCount: number;
      }
    >();

    entries.forEach((entry) => {
      const dateKey = getDateKey(entry);
      const existing = dailyData.get(dateKey) ?? {
        sentimentScores: [],
        stressLevels: [],
        emotions: [],
        entryCount: 0,
      };

      existing.sentimentScores.push(entry.sentiment_score ?? 0);
      existing.stressLevels.push(entry.stress_level ?? 0);
      existing.emotions.push(getVisibleEmotion(entry));
      existing.entryCount += 1;

      dailyData.set(dateKey, existing);
    });

    return Array.from(dailyData.entries())
      .map(([date, data]) => ({
        date,
        avg_sentiment:
          data.sentimentScores.reduce((sum, score) => sum + score, 0) / data.sentimentScores.length,
        avg_stress:
          data.stressLevels.reduce((sum, score) => sum + score, 0) / data.stressLevels.length,
        most_common_emotion: getMostCommon(data.emotions),
        entry_count: data.entryCount,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [entries]);

  const insights = useMemo<InsightSummary | null>(() => {
    if (entries.length === 0) {
      return null;
    }

    const sentiments = entries.map((entry) => entry.sentiment_score ?? 0);
    const stressLevels = entries.map((entry) => entry.stress_level ?? 0);
    const emotions = entries.map(getVisibleEmotion);
    const datedEntries = entries
      .map((entry) => new Date(entry.date || entry.created_at || entry.updated_at))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());

    const avgSentiment = sentiments.reduce((sum, score) => sum + score, 0) / sentiments.length;
    const avgStress = stressLevels.reduce((sum, score) => sum + score, 0) / stressLevels.length;
    const mostCommonEmotion = getMostCommon(emotions);

    const uniqueDays = new Set(entries.map(getDateKey)).size;
    const firstEntryDate = datedEntries[0];
    const lastEntryDate = datedEntries[datedEntries.length - 1];
    const spanDays =
      firstEntryDate && lastEntryDate
        ? Math.max(
            1,
            Math.round(
              (lastEntryDate.getTime() - firstEntryDate.getTime()) / (1000 * 60 * 60 * 24),
            ) + 1,
          )
        : uniqueDays;
    const consistencyRatio = spanDays > 0 ? uniqueDays / spanDays : 0;

    const insightLines = [
      `Built from all ${entries.length} saved entries in your journal history.`,
      `Your average mood sits at ${avgSentiment.toFixed(1)}/10, with ${mostCommonEmotion} showing up most often.`,
      `Your average stress level is ${avgStress.toFixed(1)}/10 across ${uniqueDays} writing day${uniqueDays === 1 ? '' : 's'}.`,
    ];

    if (consistencyRatio >= 0.7) {
      insightLines.push(
        `You have written on ${uniqueDays} of the last ${spanDays} tracked days, which shows strong consistency.`,
      );
    } else if (consistencyRatio >= 0.35) {
      insightLines.push(
        `Your writing rhythm is steady enough to show patterns, with entries spread across ${uniqueDays} different days.`,
      );
    } else {
      insightLines.push(
        `Your entries are more occasional right now, so each new reflection will sharpen the pattern tracking.`,
      );
    }

    const suggestions: string[] = [];

    if (avgStress >= 7) {
      suggestions.push(
        'High-stress entries are clustering. A short daily reset or wind-down routine could help.',
      );
    } else if (avgStress >= 4.5) {
      suggestions.push(
        'Stress looks moderate overall. It may help to notice what tends to happen before heavier days.',
      );
    }

    if (avgSentiment <= 3.5) {
      suggestions.push(
        'Your lower-mood entries are prominent. Consider checking in with someone you trust if that pattern continues.',
      );
    } else if (avgSentiment >= 7) {
      suggestions.push(
        'Your overall tone is strong. Revisiting what supports those better days could be useful.',
      );
    }

    if (suggestions.length === 0) {
      suggestions.push(
        'Keep writing with detail. More entries will make the dashboard trends even more useful.',
      );
    }

    return {
      insights: insightLines,
      suggestions,
      data_available: true,
      avg_sentiment: Number(avgSentiment.toFixed(3)),
      avg_stress: Number(avgStress.toFixed(3)),
      entry_count: entries.length,
      timeframe_label: 'all saved entries',
    };
  }, [entries]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

  const averageMood =
    trends.length > 0
      ? (trends.reduce((sum, trend) => sum + trend.avg_sentiment, 0) / trends.length).toFixed(1)
      : '0.0';
  const averageStress =
    trends.length > 0
      ? (trends.reduce((sum, trend) => sum + trend.avg_stress, 0) / trends.length).toFixed(1)
      : '0.0';

  if (loading) {
    return (
      <div className="panel-card chart-card">
        <div className="flex items-center justify-center h-64">
          <div
            className="animate-spin rounded-full h-8 w-8 border-b-2"
            style={{ borderColor: 'transparent', borderBottomColor: 'var(--icon-accent)' }}
          ></div>
        </div>
      </div>
    );
  }

  if (trends.length === 0 || !insights) {
    return (
      <div className="soft-empty">
        <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold">No dashboard data yet</h3>
        <p>Start writing journal entries to see your mood trends and insights.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="overview-grid">
        <div className="metric-card">
          <TrendingUp className="h-5 w-5" style={{ color: 'var(--icon-accent)' }} />
          <strong>{averageMood}</strong>
          <span>Average mood across all saved entries.</span>
        </div>
        <div className="metric-card">
          <Heart className="h-5 w-5" style={{ color: 'var(--icon-heart)' }} />
          <strong>{averageStress}</strong>
          <span>Average stress level across the same history.</span>
        </div>
      </div>

      <div className="panel-card insight-card">
        <div className="section-heading">
          <div>
            <div className="eyebrow">
              <Brain className="h-4 w-4" />
              Insight summary
            </div>
            <h2 className="section-title mt-3">A gentle read on everything in your Entries list</h2>
            <p className="muted-copy mt-2">
              This dashboard now summarizes {insights.timeframe_label}, not just your most recent
              few days.
            </p>
          </div>
        </div>

        <div className="insight-list">
          {insights.insights.map((insight, index) => (
            <div key={index} className="insight-pill">
              {insight}
            </div>
          ))}
        </div>

        {insights.suggestions.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium mb-2" style={{ color: 'var(--heading-strong)' }}>
              Suggested next steps
            </h4>
            <ul className="suggestion-list">
              {insights.suggestions.map((suggestion, index) => (
                <li key={index} className="suggestion-item">
                  <span className="mt-1" style={{ color: 'var(--icon-support)' }}>
                    •
                  </span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="panel-card chart-card">
          <div className="section-heading">
            <div>
              <h3 className="section-title" style={{ fontSize: '1.125rem', lineHeight: '1.75rem' }}>
                Mood trends
              </h3>
              <p className="muted-copy">
                A clear line showing how your emotional tone has shifted across all saved entries.
              </p>
            </div>
            <TrendingUp className="h-5 w-5" style={{ color: 'var(--icon-support)' }} />
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
              <Tooltip
                labelFormatter={(value) => formatDate(value)}
                formatter={(value: number) => [value.toFixed(2), 'Mood']}
              />
              <Line
                type="monotone"
                dataKey="avg_sentiment"
                stroke="var(--chart-line)"
                strokeWidth={3}
                dot={{ fill: 'var(--chart-line)', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="panel-card chart-card">
          <div className="section-heading">
            <div>
              <h3 className="section-title" style={{ fontSize: '1.125rem', lineHeight: '1.75rem' }}>
                Stress levels
              </h3>
              <p className="muted-copy">
                Notice when heavier days start clustering together over time.
              </p>
            </div>
            <Heart className="h-5 w-5" style={{ color: 'var(--icon-heart)' }} />
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
              <Tooltip
                labelFormatter={(value) => formatDate(value)}
                formatter={(value: number) => [value.toFixed(1), 'Stress']}
              />
              <Bar dataKey="avg_stress" fill="var(--chart-bar)" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="disclaimer-card p-4">
        <div className="flex items-start gap-2">
          <AlertCircle
            className="h-5 w-5 mt-0.5 flex-shrink-0"
            style={{ color: 'var(--alert-text)' }}
          />
          <div className="text-sm disclaimer-copy">
            <strong>AI analysis disclaimer:</strong> These patterns and insights can be useful for
            reflection, but they are not a substitute for professional mental health advice.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
