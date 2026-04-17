import { create } from 'zustand';
import api from '../services/api';

export interface Request {
  id: string;
  requester_id: string;
  category: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  location_name: string;
  timing: 'now' | 'scheduled';
  scheduled_at?: string;
  urgency: 'low' | 'medium' | 'high';
  notes?: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

interface RequestsState {
  requests: Request[];
  nearbyRequests: Request[];
  currentRequest: Request | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchRequests: (skip?: number, limit?: number) => Promise<void>;
  fetchNearbyRequests: (
    latitude: number,
    longitude: number,
    radiusKm?: number,
    category?: string
  ) => Promise<void>;
  fetchRequest: (requestId: string) => Promise<void>;
  createRequest: (requestData: any) => Promise<void>;
  updateRequest: (requestId: string, updateData: any) => Promise<void>;
  deleteRequest: (requestId: string) => Promise<void>;
  clearCurrentRequest: () => void;
  clearError: () => void;
}

export const useRequestsStore = create<RequestsState>((set) => ({
  requests: [],
  nearbyRequests: [],
  currentRequest: null,
  isLoading: false,
  error: null,

  fetchRequests: async (skip = 0, limit = 20) => {
    set({ isLoading: true, error: null });
    try {
      const requests = await api.getRequests(skip, limit);
      set({ requests, isLoading: false });
    } catch (error: any) {
      set({
        error: error?.message || 'Failed to fetch requests',
        isLoading: false,
      });
    }
  },

  fetchNearbyRequests: async (latitude, longitude, radiusKm = 5, category) => {
    set({ isLoading: true, error: null });
    try {
      const nearbyRequests = await api.getNearbyRequests(latitude, longitude, radiusKm, category);
      set({ nearbyRequests, isLoading: false });
    } catch (error: any) {
      set({
        error: error?.message || 'Failed to fetch nearby requests',
        isLoading: false,
      });
    }
  },

  fetchRequest: async (requestId) => {
    set({ isLoading: true, error: null });
    try {
      const currentRequest = await api.getRequest(requestId);
      set({ currentRequest, isLoading: false });
    } catch (error: any) {
      set({
        error: error?.message || 'Failed to fetch request',
        isLoading: false,
      });
    }
  },

  createRequest: async (requestData) => {
    set({ isLoading: true, error: null });
    try {
      const newRequest = await api.createRequest(requestData);
      set((state) => ({
        requests: [newRequest, ...state.requests],
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error?.message || 'Failed to create request',
        isLoading: false,
      });
      throw error;
    }
  },

  updateRequest: async (requestId, updateData) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await api.updateRequest(requestId, updateData);
      set((state) => ({
        currentRequest: updated,
        requests: state.requests.map((r) => (r.id === requestId ? updated : r)),
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error?.message || 'Failed to update request',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteRequest: async (requestId) => {
    set({ isLoading: true, error: null });
    try {
      await api.deleteRequest(requestId);
      set((state) => ({
        requests: state.requests.filter((r) => r.id !== requestId),
        currentRequest:
          state.currentRequest?.id === requestId ? null : state.currentRequest,
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error?.message || 'Failed to delete request',
        isLoading: false,
      });
      throw error;
    }
  },

  clearCurrentRequest: () => set({ currentRequest: null }),
  clearError: () => set({ error: null }),
}));
