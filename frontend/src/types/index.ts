export interface JournalEntry {
  id: number;
  date: string;
  content: string;
  sentiment_score: number | null;
  emotion: string | null;
  emotion_confidence?: number | null;
  emotions_detected?: Array<[string, number]>; // List of [emotion, confidence] tuples
  emotion_group?: string | null;
  stress_level: number | null;
  word_count?: number | null;
  created_at: string;
  updated_at: string;
}

export interface JournalEntryCreate {
  content: string;
  date?: string;
}

export interface SentimentTrend {
  date: string;
  avg_sentiment: number;
  avg_stress: number;
  most_common_emotion: string;
  entry_count: number;
}

export interface SentimentTrendsResponse {
  trends: SentimentTrend[];
  total_entries: number;
  days_analyzed: number;
}

export interface Insight {
  insights: string[];
  suggestions: string[];
  data_available: boolean;
  avg_sentiment?: number;
  avg_stress?: number;
  entry_count?: number;
}
