import axios from 'axios';
import { JournalEntry, JournalEntryCreate, SentimentTrendsResponse, Insight } from '../types';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Route helpers (keeps string construction in one place)
const routes = {
  entries: (page: number, perPage: number) => `/entries/?page=${page}&per_page=${perPage}`,
  entryById: (id: number) => `/entries/${id}`,
  createEntry: () => '/entries/',
  sentimentTrends: (days: number) => `/analytics/sentiment-trends?days=${days}`,
  insights: () => '/analytics/insights',
};

export const journalApi = {
  // Create a new journal entry
  createEntry: async (entry: JournalEntryCreate): Promise<JournalEntry> => {
    const { data } = await api.post(routes.createEntry(), entry);
    return data as JournalEntry;
  },

  // Get paginated journal entries (returns only the entries array)
  getEntries: async (page = 1, perPage = 10): Promise<JournalEntry[]> => {
    const { data } = await api.get(routes.entries(page, perPage));
    return (data?.entries as JournalEntry[]) ?? [];
  },

  // Get a specific journal entry
  getEntry: async (id: number): Promise<JournalEntry> => {
    const { data } = await api.get(routes.entryById(id));
    return data as JournalEntry;
  },

  // Get sentiment trends
  getSentimentTrends: async (days = 30): Promise<SentimentTrendsResponse> => {
    const { data } = await api.get(routes.sentimentTrends(days));
    return data as SentimentTrendsResponse;
  },

  // Get insights and suggestions
  getInsights: async (): Promise<Insight> => {
    const { data } = await api.get(routes.insights());
    return data as Insight;
  },
};

export default api;
