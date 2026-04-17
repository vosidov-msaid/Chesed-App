import { create } from 'zustand';
import api from '../services/api';

// Helper to extract error message from various error formats
const getErrorMessage = (error: any): string => {
  // If it's a string, return it
  if (typeof error === 'string') {
    return error;
  }

  // If it's an array (Pydantic validation errors), extract first error's message
  if (Array.isArray(error)) {
    const firstError = error[0];
    if (typeof firstError === 'string') return firstError;
    if (firstError?.msg) return firstError.msg;
    return 'Validation error';
  }

  // If it's an object with detail property
  if (error?.detail) {
    // If detail is an array, get first message
    if (Array.isArray(error.detail)) {
      const firstError = error.detail[0];
      if (typeof firstError === 'string') return firstError;
      if (firstError?.msg) return firstError.msg;
      return 'Validation error';
    }
    // If detail is a string, return it
    return String(error.detail);
  }

  // Fallback
  return error?.message || 'An error occurred';
};

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
    
    try {
      const result = await api.login(phoneNumber, password);
      
      // Check if login response has access_token (successful login)
      if (result.access_token) {
        // Login successful - mark as signed in
        set({
          isSignedIn: true,
          isLoading: false,
          error: null,
        });

        // Fetch full user data in background - don't let this block login
        setTimeout(async () => {
          try {
            const user = await api.getCurrentUser();
            set({ user });
          } catch (userError: any) {
            // Silently fail - user is already logged in with valid token
          }
        }, 0);
      } else if (result.message && result.message.toLowerCase().includes('verify')) {
        // Email verification pending - this is not an error, just a message
        set({
          isLoading: false,
          error: result.message,
          isSignedIn: false,
        });
      } else {
        // Unexpected response - no token and no message
        set({
          isLoading: false,
          error: 'Unexpected login response',
          isSignedIn: false,
        });
      }
      
    } catch (error: any) {
      set({
        error: getErrorMessage(error?.response?.data || error),
        isLoading: false,
        isSignedIn: false,
      });
    }
  },

  register: async (phoneNumber, firstName, lastName, email, password) => {
    set({ isLoading: true, error: null });
    try {
      await api.register(phoneNumber, firstName, lastName, email, password);

      // Try to auto-login after registration
      try {
        const loginResponse = await api.login(phoneNumber, password);
        
        // Check if login response has access_token (successful login)
        if (loginResponse.access_token) {
          set({
            isSignedIn: true,
            isLoading: false,
          });

          // Fetch user data
          try {
            const user = await api.getCurrentUser();
            set({ user });
          } catch (userError: any) {
            // Silently fail
          }
        } else if (loginResponse.message && loginResponse.message.toLowerCase().includes('verify')) {
          // Email verification pending
          set({ isLoading: false });
          throw new Error(loginResponse.message);
        }
      } catch (loginError: any) {
        // If it's a message about email verification, treat as success
        const errorMsg = loginError?.message || loginError?.response?.data?.detail || '';
        if (errorMsg.toLowerCase().includes('verify')) {
          set({ isLoading: false });
          throw loginError; // Re-throw with verification message
        }
        // Other login errors are actual failures
        throw loginError;
      }
    } catch (error: any) {
      set({
        error: getErrorMessage(error?.response?.data || error),
        isLoading: false,
      });
    }
  },

  getCurrentUser: async () => {
    set({ isLoading: true });
    try {
      const user = await api.getCurrentUser();
      set({
        user,
        isSignedIn: true,
        isLoading: false,
      });
    } catch (error) {
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
      await api.logout();
      set({
        user: null,
        isSignedIn: false,
        isLoading: false,
      });
    } catch (error: any) {
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
      const token = await api.getAccessToken();

      if (token) {
        try {
          const user = await api.getCurrentUser();
          set({
            user,
            isSignedIn: true,
            isLoading: false,
          });
        } catch (error) {
          // Token exists but user fetch failed - clear it and start fresh
          set({
            user: null,
            isSignedIn: false,
            isLoading: false,
          });
        }
      } else {
        set({
          user: null,
          isSignedIn: false,
          isLoading: false,
        });
      }
    } catch (error) {
      set({
        user: null,
        isSignedIn: false,
        isLoading: false,
      });
    }
  },
}));
