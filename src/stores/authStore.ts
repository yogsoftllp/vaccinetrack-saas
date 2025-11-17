import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, authAPI } from '../utils/supabase';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  userType: 'clinic' | 'parent' | 'superadmin' | null;
  
  // Actions
  login: (email: string, password: string, userType?: 'clinic' | 'parent' | 'superadmin') => Promise<void>;
  superadminLogin: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      userType: null,

      login: async (email: string, password: string, userType: 'clinic' | 'parent' | 'superadmin' = 'clinic') => {
        set({ isLoading: true, error: null });
        
        try {
          let response;
          
          if (userType === 'parent') {
            // Use parent authentication API
            const res = await fetch('/api/parent-auth/login', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email, password }),
            });
            
            response = await res.json();
          } else {
            // Use existing clinic authentication
            response = await authAPI.login(email, password);
          }
          
          if (response.error) {
            set({ 
              error: response.error.message || 'Login failed', 
              isLoading: false 
            });
            return;
          }

          if (response.data || response.user) {
            const userData = response.data || response.user;
            set({ 
              user: userData.parent || userData, 
              isAuthenticated: true, 
              isLoading: false,
              error: null,
              userType 
            });
            
            // Store token for parent auth
            if (userType === 'parent' && response.data?.token) {
              localStorage.setItem('parentToken', response.data.token);
            }
          }
        } catch (error) {
          set({ 
            error: 'An unexpected error occurred', 
            isLoading: false 
          });
        }
      },

      superadminLogin: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch('/api/super-admin/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          const result = await response.json();

          if (!response.ok || !result.success) {
            set({ 
              error: result.error || 'Super admin login failed', 
              isLoading: false 
            });
            return;
          }

          if (result.data) {
            // Store the access token
            if (result.data.access_token) {
              localStorage.setItem('superadmin_token', result.data.access_token);
            }
            
            set({ 
              user: result.data.user, 
              isAuthenticated: true, 
              isLoading: false,
              error: null,
              userType: 'superadmin'
            });
          }
        } catch (error) {
          set({ 
            error: 'An unexpected error occurred', 
            isLoading: false 
          });
        }
      },

      register: async (data: any) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch('/api/parent-auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });
          
          const result = await response.json();
          
          if (result.error) {
            set({ 
              error: result.error.details || 'Registration failed', 
              isLoading: false 
            });
            return;
          }

          if (result.data) {
            set({ 
              user: result.data.parent, 
              isAuthenticated: true, 
              isLoading: false,
              error: null,
              userType: 'parent' 
            });
            
            // Store token
            if (result.data.token) {
              localStorage.setItem('parentToken', result.data.token);
            }
          }
        } catch (error) {
          set({ 
            error: 'An unexpected error occurred', 
            isLoading: false 
          });
        }
      },

      logout: async () => {
        set({ isLoading: true });
        
        try {
          const { userType } = get();
          
          if (userType === 'parent') {
            // Clear parent token
            localStorage.removeItem('parentToken');
          } else if (userType === 'superadmin') {
            // Clear superadmin token
            localStorage.removeItem('superadmin_token');
          } else {
            // Use existing clinic logout
            await authAPI.logout();
          }
          
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false,
            userType: null 
          });
        } catch (error) {
          set({ 
            error: 'Logout failed', 
            isLoading: false 
          });
        }
      },

      checkAuth: async () => {
        set({ isLoading: true });
        
        try {
          // Check if we have a token in localStorage for parent auth
          const parentToken = localStorage.getItem('parentToken');
          if (parentToken) {
            // For now, consider parent authenticated if token exists
            set({ 
              user: null, 
              isAuthenticated: true, 
              isLoading: false,
              userType: 'parent'
            });
            return;
          }

          // Check if we have a token in localStorage for superadmin auth
          const superadminToken = localStorage.getItem('superadmin_token');
          if (superadminToken) {
            // For now, consider superadmin authenticated if token exists
            set({ 
              user: null, 
              isAuthenticated: true, 
              isLoading: false,
              userType: 'superadmin'
            });
            return;
          }

          // Try to get current user from Supabase
          const user = await authAPI.getCurrentUser();
          const isAuthenticated = await authAPI.isAuthenticated();
          
          set({ 
            user, 
            isAuthenticated, 
            isLoading: false 
          });
        } catch (error) {
          // If Supabase fails, default to not authenticated but stop loading
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false 
          });
        }
      },

      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated,
        userType: state.userType 
      })
    }
  )
);