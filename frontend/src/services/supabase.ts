import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserProfile } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Local fallback user management for frictionless hackathon demonstration
const LOCAL_USER_KEY = 'truthlens_mock_user';

export const authService = {
  async getCurrentUser(): Promise<UserProfile | null> {
    if (supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          return {
            id: session.user.id,
            email: session.user.email || '',
            full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
          };
        }
      } catch (err) {
        console.warn('Supabase auth error, falling back to local session', err);
      }
    }
    
    // Fallback to local session
    const saved = localStorage.getItem(LOCAL_USER_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  },

  async signIn(email: string, password?: string): Promise<UserProfile> {
    if (supabase && password) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user) {
        return {
          id: data.user.id,
          email: data.user.email || email,
          full_name: data.user.user_metadata?.full_name || email.split('@')[0],
        };
      }
    }

    // Local demo login fallback
    const user: UserProfile = {
      id: 'demo-analyst-' + Math.random().toString(36).substring(2, 8),
      email: email || 'analyst@truthlens.ai',
      full_name: (email.split('@')[0] || 'Senior Analyst').replace('.', ' '),
    };
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
    return user;
  },

  async signUp(email: string, password?: string, fullName?: string): Promise<UserProfile> {
    if (supabase && password) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName || email.split('@')[0] }
        }
      });
      if (error) throw error;
      if (data.user) {
        return {
          id: data.user.id,
          email: data.user.email || email,
          full_name: fullName || email.split('@')[0],
        };
      }
    }

    const user: UserProfile = {
      id: 'demo-analyst-' + Math.random().toString(36).substring(2, 8),
      email: email,
      full_name: fullName || email.split('@')[0],
    };
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
    return user;
  },

  async signOut(): Promise<void> {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {}
    }
    localStorage.removeItem(LOCAL_USER_KEY);
  }
};
