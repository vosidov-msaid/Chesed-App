import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PreferenceState {
  hasSeenHint: boolean;
  isLoadingPreferences: boolean;
  
  // Actions
  markHintAsSeen: () => Promise<void>;
  loadPreferences: () => Promise<void>;
  resetPreferences: () => Promise<void>;
}

export const usePreferenceStore = create<PreferenceState>((set) => ({
  hasSeenHint: false,
  isLoadingPreferences: false,

  markHintAsSeen: async () => {
    try {
      await AsyncStorage.setItem('hasSeenHint', 'true');
      set({ hasSeenHint: true });
    } catch (error) {
      console.error('Failed to save hint preference:', error);
    }
  },

  loadPreferences: async () => {
    set({ isLoadingPreferences: true });
    try {
      const hasSeenHint = await AsyncStorage.getItem('hasSeenHint');
      set({ 
        hasSeenHint: hasSeenHint === 'true',
        isLoadingPreferences: false,
      });
    } catch (error) {
      console.error('Failed to load preferences:', error);
      set({ isLoadingPreferences: false });
    }
  },

  resetPreferences: async () => {
    try {
      await AsyncStorage.removeItem('hasSeenHint');
      set({ hasSeenHint: false });
    } catch (error) {
      console.error('Failed to reset preferences:', error);
    }
  },
}));
