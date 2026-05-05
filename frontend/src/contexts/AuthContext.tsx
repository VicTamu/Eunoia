import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, auth } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isPasswordRecovery: boolean;
  signUp: (email: string, password: string) => Promise<{ data: unknown; error: unknown }>;
  signIn: (email: string, password: string) => Promise<{ data: unknown; error: unknown }>;
  signOut: () => Promise<{ error: unknown }>;
  resetPasswordForEmail: (email: string) => Promise<{ error: unknown }>;
  resendSignupEmail: (email: string) => Promise<{ error: unknown }>;
  updatePassword: (password: string) => Promise<{ data: unknown; error: unknown }>;
  clearPasswordRecovery: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    const authFlowHint =
      typeof window !== 'undefined'
        ? `${window.location.search}${window.location.hash}`.toLowerCase()
        : '';

    if (authFlowHint.includes('auth_flow=recovery') || authFlowHint.includes('type=recovery')) {
      setIsPasswordRecovery(true);
    }

    // Get initial session
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // eslint-disable-next-line no-console
      console.log('[AuthContext] Auth state change:', event);
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      } else if (event === 'SIGNED_OUT') {
        setIsPasswordRecovery(false);
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Set up automatic token refresh
    const refreshInterval = setInterval(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        // Check if token expires in the next 5 minutes
        const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;

        if (expiresAt - now < fiveMinutes) {
          // eslint-disable-next-line no-console
          console.log('[AuthContext] Token expiring soon, refreshing...');
          await supabase.auth.refreshSession();
        }
      }
    }, 60000); // Check every minute

    return () => {
      subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    return await auth.signUp(email, password);
  };

  const signIn = async (email: string, password: string) => {
    return await auth.signIn(email, password);
  };

  const signOut = async () => {
    return await auth.signOut();
  };

  const resetPasswordForEmail = async (email: string) => {
    return await auth.resetPasswordForEmail(email);
  };

  const resendSignupEmail = async (email: string) => {
    return await auth.resendSignupEmail(email);
  };

  const updatePassword = async (password: string) => {
    return await auth.updatePassword(password);
  };

  const clearPasswordRecovery = () => {
    setIsPasswordRecovery(false);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('auth_flow');
      if (url.hash.includes('type=recovery')) {
        url.hash = '';
      }
      window.history.replaceState({}, document.title, url.toString());
    }
  };

  const value = {
    user,
    session,
    loading,
    isPasswordRecovery,
    signUp,
    signIn,
    signOut,
    resetPasswordForEmail,
    resendSignupEmail,
    updatePassword,
    clearPasswordRecovery,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
