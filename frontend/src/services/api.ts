import axios from 'axios';
import { JournalEntry, JournalEntryCreate, SentimentTrendsResponse, Insight } from '../types';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const journalApi = {
  // Create a new journal entry
  createEntry: async (entry: JournalEntryCreate): Promise<JournalEntry> => {
    const response = await api.post('/entries/', entry);
    return response.data;
  },

  // Get all journal entries
  getEntries: async (page: number = 1, perPage: number = 10): Promise<JournalEntry[]> => {
    const response = await api.get(`/entries/?page=${page}&per_page=${perPage}`);
    // Backend returns a paginated object; we only need the entries array here
    return response.data.entries ?? [];
  },

  // Get a specific journal entry
  getEntry: async (id: number): Promise<JournalEntry> => {
    const response = await api.get(`/entries/${id}`);
    return response.data;
  },

  // Get sentiment trends
  getSentimentTrends: async (days: number = 30): Promise<SentimentTrendsResponse> => {
    const response = await api.get(`/analytics/sentiment-trends?days=${days}`);
    return response.data;
  },

  // Get insights and suggestions
  getInsights: async (): Promise<Insight> => {
    const response = await api.get('/analytics/insights');
    return response.data;
  },
};

export default api;
