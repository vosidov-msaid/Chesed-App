import { create } from 'zustand';
import api from '../services/api';

export interface User {
  id: string;
  phone_number: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'rider' | 'driver' | 'both';
  reputation_score: number;
  is_active: boolean;
  is_verified: boolean;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isSignedIn: boolean;
  error: string | null;

  // Actions
  login: (phoneNumber: string, password: string) => Promise<void>;
  register: (
    phoneNumber: string,
    firstName: string,
    lastName: string,
    email: string,
    password: string
  ) => Promise<void>;
  getCurrentUser: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  hydrateAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isSignedIn: false,
  error: null,

  login: async (phoneNumber, password) => {
    set({ isLoading: true, error: null });
    console.log('[Auth] Starting login...');
    
    try {
      console.log('[Auth] Calling api.login()...');
      const result = await api.login(phoneNumber, password);
      console.log('[Auth] api.login() succeeded, received:', Object.keys(result));
      
      // Mark as signed in immediately - LOGIN IS SUCCESSFUL AT THIS POINT
      console.log('[Auth] Setting isSignedIn = true');
      set({
        isSignedIn: true,
        isLoading: false,
        error: null,
      });
      console.log('[Auth] Login complete, user can now navigate to (app)');

      // Fetch full user data in background - don't let this block login
      setTimeout(async () => {
        try {
          console.log('[Auth] Background: Fetching current user data...');
          const user = await api.getCurrentUser();
          console.log('[Auth] Background: User data fetched successfully');
          set({ user });
        } catch (userError: any) {
          console.error('[Auth] Background: Failed to fetch user data:', userError.message);
          // Silently fail - user is already logged in with valid token
        }
      }, 0);
      
    } catch (error: any) {
      console.error('[Auth] Login FAILED:', error.message);
      set({
        error: error?.response?.data?.detail || error.message || 'Login failed',
        isLoading: false,
        isSignedIn: false,
      });
      throw error;
    }
  },

  register: async (phoneNumber, firstName, lastName, email, password) => {
    set({ isLoading: true, error: null });
    try {
      console.log('[Auth] Starting registration');
      await api.register(phoneNumber, firstName, lastName, email, password);
      console.log('[Auth] Registration successful, logging in...');

      // Auto-login after registration
      await api.login(phoneNumber, password);
      console.log('[Auth] Auto-login successful after registration');

      set({
        isSignedIn: true,
        isLoading: false,
      });

      // Fetch user data
      try {
        const user = await api.getCurrentUser();
        set({ user });
      } catch (userError: any) {
        console.error('[Auth] Failed to fetch user after registration:', userError);
        // Still signed in, just don't have full user data yet
      }
    } catch (error: any) {
      console.error('[Auth] Registration failed:', error?.response?.data || error.message);
      set({
        error: error?.response?.data?.detail || 'Registration failed',
        isLoading: false,
      });
      throw error;
    }
  },

  getCurrentUser: async () => {
    set({ isLoading: true });
    try {
      console.log('[Auth] Fetching current user...');
      const user = await api.getCurrentUser();
      console.log('[Auth] Current user fetched');
      set({
        user,
        isSignedIn: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('[Auth] Failed to get current user:', error);
      set({
        user: null,
        isSignedIn: false,
        isLoading: false,
      });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      console.log('[Auth] Logging out...');
      await api.logout();
      console.log('[Auth] Logout successful');
      set({
        user: null,
        isSignedIn: false,
        isLoading: false,
      });
    } catch (error: any) {
      console.error('[Auth] Logout failed:', error);
      set({
        error: error?.message || 'Logout failed',
        isLoading: false,
      });
    }
  },

  clearError: () => set({ error: null }),

  hydrateAuth: async () => {
    set({ isLoading: true });
    try {
      console.log('[Auth] Hydrating auth state...');
      const token = await api.getAccessToken();
      console.log('[Auth] Token check:', token ? 'Found' : 'Not found');

      if (token) {
        try {
          const user = await api.getCurrentUser();
          console.log('[Auth] Hydration successful, user:', user.phone_number);
          set({
            user,
            isSignedIn: true,
            isLoading: false,
          });
        } catch (error) {
          console.error('[Auth] Token exists but getCurrentUser failed:', error);
          // Token exists but user fetch failed - clear it and start fresh
          set({
            user: null,
            isSignedIn: false,
            isLoading: false,
          });
        }
      } else {
        console.log('[Auth] No token found, user not signed in');
        set({
          user: null,
          isSignedIn: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('[Auth] Hydration error:', error);
      set({
        user: null,
        isSignedIn: false,
        isLoading: false,
      });
    }
  },
}));
