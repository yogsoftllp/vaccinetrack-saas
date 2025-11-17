import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from '../../supabase/config';

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);

// Auth types
export interface User {
  id: string;
  email: string;
  role: 'pediatrician' | 'nurse' | 'administrator' | 'receptionist';
  first_name: string;
  last_name: string;
  license_number?: string;
  clinic_id: string;
  tenant_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: User | null;
  session: any;
  error: any;
}

// Authentication functions
export const authAPI = {
  // Login function
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Get user details from users table
      if (data.user) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (userError) throw userError;

        return {
          user: userData as User,
          session: data.session,
          error: null
        };
      }

      return { user: null, session: null, error: 'No user found' };
    } catch (error) {
      return { user: null, session: null, error };
    }
  },

  // Logout function
  async logout(): Promise<{ error: any }> {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      return { error };
    }
  },

  // Get current user
  async getCurrentUser(): Promise<User | null> {
    try {
      // Quick check if Supabase is configured
      if (!supabase || !supabase.auth) {
        return null;
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        return userData as User;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      // Quick check if Supabase is configured
      if (!supabase || !supabase.auth) {
        return false;
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      return !!session;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  },

  // Subscribe to auth changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
};

export default supabase;