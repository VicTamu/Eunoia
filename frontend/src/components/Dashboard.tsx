import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Brain, Heart, Calendar, AlertCircle } from 'lucide-react';
import { journalApi } from '../services/api';
import { SentimentTrend, Insight } from '../types';
import { useDataErrorHandler } from '../hooks/useErrorHandler';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const [trends, setTrends] = useState<SentimentTrend[]>([]);
  const [insights, setInsights] = useState<Insight | null>(null);
  const { user, session, loading } = useAuth();
  const { error, isLoading, handleAsync, retry, lastRetryFn } = useDataErrorHandler({
    component: 'Dashboard',
  });

  useEffect(() => {
    // Only load data when user is authenticated and session is available
    if (user && session && !loading) {
      loadDashboardData();
    }
  }, [user, session, loading]);

  const loadDashboardData = async () => {
    const result = await handleAsync(async () => {
      const [trendsData, insightsData] = await Promise.all([
        journalApi.getSentimentTrends(14), // Last 14 days
        journalApi.getInsights()
      ]);
      
      setTrends(trendsData.trends);
      setInsights(insightsData);
    }, {
      component: 'Dashboard',
      action: 'load_dashboard_data'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getSentimentColor = (score: number) => {
    if (score > 7) return '#10B981'; // Green
    if (score < 3) return '#EF4444'; // Red
    return '#6B7280'; // Gray
  };

  const getStressColor = (level: number) => {
    if (level > 7) return '#EF4444'; // Red
    if (level > 4) return '#F59E0B'; // Yellow
    return '#10B981'; // Green
  };

  // Show loading if auth is still loading or data is loading
  if (loading || isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
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
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center text-gray-600">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">No Data Yet</h3>
          <p>Start writing journal entries to see your mood trends and insights!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Insights Section */}
      {insights && insights.data_available && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="h-5 w-5 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-800">AI Insights</h2>
          </div>
          
          <div className="space-y-4">
            {insights.insights.map((insight, index) => (
              <div key={index} className="p-3 bg-blue-50 rounded-md">
                <p className="text-blue-800">{insight}</p>
              </div>
            ))}
            
            {insights.suggestions.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-700 mb-2">Suggestions:</h4>
                <ul className="space-y-2">
                  {insights.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">•</span>
                      <span className="text-gray-700">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment Trends */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-800">Mood Trends</h3>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                domain={[0, 10]}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                labelFormatter={(value) => formatDate(value)}
                formatter={(value: number) => [
                  value.toFixed(2), 
                  'Sentiment Score'
                ]}
              />
              <Line 
                type="monotone" 
                dataKey="avg_sentiment" 
                stroke="#3B82F6" 
                strokeWidth={2}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Stress Levels */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="h-5 w-5 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-800">Stress Levels</h3>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                domain={[0, 10]}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                labelFormatter={(value) => formatDate(value)}
                formatter={(value: number) => [
                  value.toFixed(1), 
                  'Stress Level'
                ]}
              />
              <Bar 
                dataKey="avg_stress" 
                fill="#EF4444"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Emotion Analysis Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-800">Enhanced Emotion Analysis</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-3">GoEmotions Categories</h4>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Joy</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Love</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Gratitude</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Pride</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Relief</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Excitement</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Optimism</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Admiration</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Amusement</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Approval</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Caring</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Negative Emotions</h4>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Sadness</span>
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Anger</span>
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Fear</span>
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Disgust</span>
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Grief</span>
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Remorse</span>
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Disappointment</span>
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Nervousness</span>
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Embarrassment</span>
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Annoyance</span>
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Disapproval</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Enhanced Analysis:</strong> Our AI now uses Google&apos;s GoEmotions dataset to detect 27
            different emotion categories, providing more nuanced and accurate emotional insights for your
            journal entries.
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {trends.length}
            </div>
            <div className="text-sm text-gray-600">Days with entries</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {trends.length > 0 ? (trends.reduce((sum, t) => sum + t.entry_count, 0) / trends.length).toFixed(1) : 0}
            </div>
            <div className="text-sm text-gray-600">Avg entries per day</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {trends.length > 0 ? (trends.reduce((sum, t) => sum + t.avg_sentiment, 0) / trends.length).toFixed(2) : 0}
            </div>
            <div className="text-sm text-gray-600">Avg mood score</div>
          </div>
        </div>
      </div>

      {/* AI Disclaimer */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-yellow-800">
            <strong>AI Analysis Disclaimer:</strong> The insights and mood analysis provided by this
            app are based on AI analysis of your text and are not a substitute for professional medical
            or mental health advice. If you&apos;re experiencing significant emotional distress, please
            consider speaking with a qualified healthcare provider.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
