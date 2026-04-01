import React, { useState, useEffect, useCallback } from 'react';
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
import { journalApi } from '../services/api';
import { SentimentTrend, Insight } from '../types';
import { useDataErrorHandler } from '../hooks/useErrorHandler';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const [trends, setTrends] = useState<SentimentTrend[]>([]);
  const [insights, setInsights] = useState<Insight | null>(null);
  const { user, session, loading } = useAuth();
  const { error, isLoading, handleAsync, retry } = useDataErrorHandler({
    component: 'Dashboard',
  });

  const loadDashboardData = useCallback(async () => {
    await handleAsync(
      async () => {
        const [trendsData, insightsData] = await Promise.all([
          journalApi.getSentimentTrends(14),
          journalApi.getInsights(),
        ]);

        setTrends(trendsData.trends);
        setInsights(insightsData);
      },
      {
        component: 'Dashboard',
        action: 'load_dashboard_data',
      },
    );
  }, [handleAsync]);

  useEffect(() => {
    if (user && session && !loading) {
      loadDashboardData();
    }
  }, [user, session, loading, loadDashboardData]);

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

  if (loading || isLoading) {
    return (
      <div className="panel-card chart-card">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel-card chart-card">
        <div className="text-center text-red-600">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          <p className="mb-4">{error.userMessage || error.message}</p>
          <button
            onClick={retry}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (trends.length === 0) {
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
          <TrendingUp className="h-5 w-5 text-blue-600" />
          <strong>{averageMood}</strong>
          <span>Average mood in your recent reflections.</span>
        </div>
        <div className="metric-card">
          <Heart className="h-5 w-5 text-red-600" />
          <strong>{averageStress}</strong>
          <span>Average stress level over the same period.</span>
        </div>
      </div>

      {insights && insights.data_available && (
        <div className="panel-card insight-card">
          <div className="section-heading">
            <div>
              <div className="eyebrow">
                <Brain className="h-4 w-4" />
                Insight summary
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mt-3">
                A gentle read on how things have been feeling
              </h2>
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
              <h4 className="font-medium text-gray-700 mb-2">Suggested next steps</h4>
              <ul className="suggestion-list">
                {insights.suggestions.map((suggestion, index) => (
                  <li key={index} className="suggestion-item">
                    <span className="text-green-600 mt-1">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="panel-card chart-card">
          <div className="section-heading">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Mood trends</h3>
              <p className="muted-copy">
                A clear line showing how your emotional tone has shifted.
              </p>
            </div>
            <TrendingUp className="h-5 w-5 text-green-600" />
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
                stroke="#0f766e"
                strokeWidth={3}
                dot={{ fill: '#0f766e', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="panel-card chart-card">
          <div className="section-heading">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Stress levels</h3>
              <p className="muted-copy">Notice when heavier days start clustering together.</p>
            </div>
            <Heart className="h-5 w-5 text-red-600" />
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
              <Bar dataKey="avg_stress" fill="#fb7185" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-yellow-800">
            <strong>AI analysis disclaimer:</strong> These patterns and insights can be useful for
            reflection, but they are not a substitute for professional mental health advice.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
