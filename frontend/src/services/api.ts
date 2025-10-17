import axios from 'axios';
import { JournalEntry, JournalEntryCreate, SentimentTrendsResponse, Insight } from '../types';
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

// Basic diagnostics to help debug blank-page issues
// Log base URL once at startup
// eslint-disable-next-line no-console
console.log('[journalApi] Base URL:', API_BASE_URL);

api.interceptors.request.use(async (config) => {
  // Get the current session and add auth header
  const {
    data: { session },
  } = await supabase.auth.getSession();
  // eslint-disable-next-line no-console
  console.log('[journalApi] Session:', session ? 'Found' : 'Not found');
  // eslint-disable-next-line no-console
  console.log('[journalApi] Access token:', session?.access_token ? 'Present' : 'Missing');

  if (session?.access_token) {
    // Check if token is close to expiration (within 5 minutes)
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at ? Math.floor(session.expires_at) : 0;
    const timeUntilExpiry = expiresAt - now;
    
    if (timeUntilExpiry < 300 && timeUntilExpiry > 0) { // 5 minutes = 300 seconds
      console.log('[journalApi] Token expiring soon, refreshing proactively...');
      try {
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
        if (!refreshError && refreshedSession?.access_token) {
          console.log('[journalApi] Token refreshed proactively');
          config.headers.Authorization = `Bearer ${refreshedSession.access_token}`;
        } else {
          console.log('[journalApi] Proactive refresh failed, using current token');
          config.headers.Authorization = `Bearer ${session.access_token}`;
        }
      } catch (error) {
        console.log('[journalApi] Proactive refresh error, using current token:', error);
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
    } else {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    // eslint-disable-next-line no-console
    console.log('[journalApi] Added auth header');
  } else {
    // eslint-disable-next-line no-console
    console.log('[journalApi] No auth header added - user not authenticated');
  }

  // eslint-disable-next-line no-console
  console.log('[journalApi] →', config.method?.toUpperCase(), config.url);
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If token expired (401) and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        console.log('[journalApi] Token expired, attempting refresh...');
        
        // Try to refresh the session
        const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.log('[journalApi] Token refresh failed:', refreshError.message);
          // Clear all auth data and redirect to login
          await supabase.auth.signOut();
          localStorage.clear();
          sessionStorage.clear();
          window.location.href = '/';
          return Promise.reject(error);
        }
        
        if (session?.access_token) {
          // Update the authorization header with new token
          originalRequest.headers.Authorization = `Bearer ${session.access_token}`;
          console.log('[journalApi] Token refreshed successfully, retrying request');
          
          // Retry the original request with new token
          return api(originalRequest);
        } else {
          console.log('[journalApi] No access token in refresh response');
          // Clear auth data and redirect
          await supabase.auth.signOut();
          localStorage.clear();
          sessionStorage.clear();
          window.location.href = '/';
          return Promise.reject(error);
        }
      } catch (refreshError) {
        console.log('[journalApi] Token refresh error:', refreshError);
        // Clear auth data and redirect to login
        await supabase.auth.signOut();
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/';
        return Promise.reject(error);
      }
    }
    
    // Convert axios error to standardized error
    const standardError = createApiError(error, {
      component: 'api',
      action: error.config?.method?.toUpperCase() + ' ' + error.config?.url,
    });
    
    // Log the error
    errorHandler.logError(standardError);
    
    // Re-throw the standardized error
    throw standardError;
  }
);

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
