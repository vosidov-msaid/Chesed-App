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
    try {
      const { user_id, first_name, last_name } = await api.login(phoneNumber, password);
      const user = await api.getCurrentUser();
      set({
        user,
        isSignedIn: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error?.response?.data?.detail || 'Login failed',
        isLoading: false,
      });
      throw error;
    }
  },

  register: async (phoneNumber, firstName, lastName, email, password) => {
    set({ isLoading: true, error: null });
    try {
      await api.register(phoneNumber, firstName, lastName, email, password);
      // Auto-login after registration
      await api.login(phoneNumber, password);
      const user = await api.getCurrentUser();
      set({
        user,
        isSignedIn: true,
        isLoading: false,
      });
    } catch (error: any) {
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
        const user = await api.getCurrentUser();
        set({
          user,
          isSignedIn: true,
          isLoading: false,
        });
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
