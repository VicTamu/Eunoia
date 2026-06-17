import axios from 'axios';
import {
  JournalEntry,
  JournalEntryCreate,
  JournalEntryUpdate,
  SentimentTrendsResponse,
  Insight,
} from '../types';
import { errorHandler, createApiError } from '../utils/errorHandler';
import { supabase } from '../lib/supabase';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  // Attach the current Supabase access token, refreshing it proactively if it
  // is close to expiring so requests don't fail mid-flight.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at ? Math.floor(session.expires_at) : 0;
    const timeUntilExpiry = expiresAt - now;

    // Refresh when the token expires within the next 5 minutes.
    if (timeUntilExpiry < 300 && timeUntilExpiry > 0) {
      try {
        const {
          data: { session: refreshedSession },
          error: refreshError,
        } = await supabase.auth.refreshSession();
        const activeToken =
          !refreshError && refreshedSession?.access_token
            ? refreshedSession.access_token
            : session.access_token;
        config.headers.Authorization = `Bearer ${activeToken}`;
      } catch {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
    } else {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // On a 401, attempt a single token refresh and retry the original request.
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const {
          data: { session },
          error: refreshError,
        } = await supabase.auth.refreshSession();

        if (!refreshError && session?.access_token) {
          originalRequest.headers.Authorization = `Bearer ${session.access_token}`;
          return api(originalRequest);
        }
      } catch {
        // Fall through to the sign-out cleanup below.
      }

      // Refresh failed: clear stale auth state and return to the landing page.
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
      return Promise.reject(error);
    }

    // Convert axios errors into the app's standardized error shape and log them.
    const standardError = createApiError(error, {
      component: 'api',
      action: error.config?.method?.toUpperCase() + ' ' + error.config?.url,
    });
    errorHandler.logError(standardError);

    throw standardError;
  },
);

// Route helpers (keeps string construction in one place)
const routes = {
  entries: (page: number, perPage: number) => `/entries/?page=${page}&per_page=${perPage}`,
  entryById: (id: number) => `/entries/${id}`,
  createEntry: () => '/entries/',
  sentimentTrends: (days: number) => `/analytics/sentiment-trends?days=${days}`,
  insights: () => '/analytics/insights',
  feedback: () => '/feedback',
};

interface PaginatedEntriesResponse {
  entries?: JournalEntry[];
  has_next?: boolean;
}

export interface FeedbackInput {
  message: string;
  rating?: number | null;
  page?: string;
}

export const journalApi = {
  // Create a new journal entry
  createEntry: async (entry: JournalEntryCreate): Promise<JournalEntry> => {
    const { data } = await api.post(routes.createEntry(), entry);
    return data as JournalEntry;
  },

  // Update an existing journal entry
  updateEntry: async (id: number, entry: JournalEntryUpdate): Promise<JournalEntry> => {
    const { data } = await api.put(routes.entryById(id), entry);
    return data as JournalEntry;
  },

  // Get paginated journal entries (returns only the entries array)
  getEntries: async (page = 1, perPage = 10): Promise<JournalEntry[]> => {
    const { data } = await api.get(routes.entries(page, perPage));
    return (data?.entries as JournalEntry[]) ?? [];
  },

  // Get the complete saved entry history for the current user
  getAllEntries: async (): Promise<JournalEntry[]> => {
    const perPage = 100;
    let page = 1;
    let hasNext = true;
    const allEntries: JournalEntry[] = [];

    while (hasNext) {
      const { data } = await api.get(routes.entries(page, perPage));
      const payload = (data ?? {}) as PaginatedEntriesResponse;
      const pageEntries = payload.entries ?? [];

      allEntries.push(...pageEntries);
      hasNext = Boolean(payload.has_next) && pageEntries.length > 0;
      page += 1;
    }

    return allEntries;
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

  // Submit product feedback
  submitFeedback: async (input: FeedbackInput): Promise<void> => {
    await api.post(routes.feedback(), input);
  },
};

export default api;
