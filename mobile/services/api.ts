import axios, { AxiosInstance } from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
const TOKEN_KEY = 'chesed_access_token';

// SecureStore is not available on web, so use AsyncStorage as fallback
const isSecureStoreAvailable = Platform.OS !== 'web';

class ApiClient {
  private api: AxiosInstance;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  constructor() {
    console.log('[API] Initializing with URL:', API_URL);
    this.api = axios.create({
      baseURL: API_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to every request
    this.api.interceptors.request.use(async (config) => {
      const token = await this.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('[API] Token added to request:', config.url);
      }
      return config;
    });

    // Handle token refresh on 401
    this.api.interceptors.response.use(
      (response) => {
        console.log('[API] Response success:', response.status, response.config.url);
        return response;
      },
      async (error) => {
        console.error('[API] Response error:', error.response?.status, error.config?.url, error.response?.data);
        const originalRequest = error.config;

        // Don't try to refresh if the failed request was already a token refresh attempt
        if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/token')) {
          originalRequest._retry = true;

          if (!this.isRefreshing) {
            this.isRefreshing = true;
            try {
              const newToken = await this.refreshAccessToken();
              this.isRefreshing = false;
              this.refreshSubscribers.forEach((subscriber) => subscriber(newToken));
              this.refreshSubscribers = [];
              return this.api(originalRequest);
            } catch (refreshError) {
              this.isRefreshing = false;
              await this.clearTokens();
              throw refreshError;
            }
          }

          return new Promise((resolve) => {
            this.refreshSubscribers.push((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(this.api(originalRequest));
            });
          });
        }

        return Promise.reject(error);
      }
    );
  }

  async login(phoneNumber: string, password: string) {
    console.log('[API] Logging in with phone:', phoneNumber);
    try {
      const response = await this.api.post('/auth/login', {
        phone_number: phoneNumber,
        password,
      });

      console.log('[API] Login response received, status:', response.status);
      console.log('[API] Response data keys:', Object.keys(response.data));
      
      const { access_token, user_id, first_name, last_name } = response.data;
      
      console.log('[API] Extracted token:', access_token ? 'YES' : 'NO');
      console.log('[API] Extracted user_id:', user_id);
      
      if (!access_token) {
        throw new Error('No access_token in login response');
      }

      console.log('[API] Calling setAccessToken()...');
      await this.setAccessToken(access_token);
      console.log('[API] Token stored successfully');
      
      return { access_token, user_id, first_name, last_name };
    } catch (error: any) {
      console.error('[API] Login caught error:', error.message);
      console.error('[API] Error response status:', error.response?.status);
      console.error('[API] Error response data:', error.response?.data);
      throw error;
    }
  }

  async register(
    phoneNumber: string,
    firstName: string,
    lastName: string,
    email: string,
    password: string
  ) {
    console.log('[API] Registering user:', phoneNumber);
    const response = await this.api.post('/users/register', {
      phone_number: phoneNumber,
      first_name: firstName,
      last_name: lastName,
      email,
      password,
      role: 'both',
    });

    console.log('[API] Registration successful');
    return response.data;
  }

  async getCurrentUser() {
    console.log('[API] Fetching current user');
    const response = await this.api.get('/auth/me');
    console.log('[API] Current user fetched:', response.data.phone_number);
    return response.data;
  }

  async getAccessToken(): Promise<string | null> {
    try {
      console.log('[SecureStore] Getting token...');
      let token: string | null = null;
      
      if (isSecureStoreAvailable) {
        token = await SecureStore.getItemAsync(TOKEN_KEY);
      } else {
        token = await AsyncStorage.getItem(TOKEN_KEY);
      }
      
      console.log('[SecureStore] Token retrieved:', token ? 'YES' : 'NO');
      return token;
    } catch (error) {
      console.error('[SecureStore] Error getting token:', error);
      return null;
    }
  }

  async setAccessToken(token: string): Promise<void> {
    try {
      console.log('[SecureStore] Setting token...');
      
      if (isSecureStoreAvailable) {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
      } else {
        await AsyncStorage.setItem(TOKEN_KEY, token);
      }
      
      console.log('[SecureStore] Token set successfully');
    } catch (error) {
      console.error('[SecureStore] Error setting token:', error);
      throw error;
    }
  }

  async refreshAccessToken(): Promise<string> {
    try {
      console.log('[API] Attempting token refresh...');
      const response = await this.api.post('/auth/token');
      const { access_token } = response.data;
      console.log('[API] Token refreshed successfully');
      await this.setAccessToken(access_token);
      return access_token;
    } catch (error: any) {
      console.error('[API] Token refresh failed:', error.response?.status, error.message);
      // If token refresh fails (401, etc), clear the invalid token
      await this.clearTokens();
      throw error;
    }
  }

  async clearTokens() {
    try {
      console.log('[SecureStore] Clearing token...');
      
      if (isSecureStoreAvailable) {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      } else {
        await AsyncStorage.removeItem(TOKEN_KEY);
      }
      
      console.log('[SecureStore] Token cleared');
    } catch (error) {
      console.error('[SecureStore] Error clearing token:', error);
    }
  }

  async logout() {
    await this.clearTokens();
  }

  // Requests endpoints
  async createRequest(requestData: any) {
    const response = await this.api.post('/requests/', requestData);
    return response.data;
  }

  async getRequests(skip: number = 0, limit: number = 20) {
    const response = await this.api.get('/requests/', { params: { skip, limit } });
    return response.data;
  }

  async getRequest(requestId: string) {
    const response = await this.api.get(`/requests/${requestId}`);
    return response.data;
  }

  async getNearbyRequests(
    latitude: number,
    longitude: number,
    radiusKm: number = 5,
    category?: string
  ) {
    const response = await this.api.get('/requests/nearby/search', {
      params: {
        latitude,
        longitude,
        radius_km: radiusKm,
        ...(category && { category }),
      },
    });
    return response.data;
  }

  async updateRequest(requestId: string, updateData: any) {
    const response = await this.api.put(`/requests/${requestId}`, updateData);
    return response.data;
  }

  async deleteRequest(requestId: string) {
    await this.api.delete(`/requests/${requestId}`);
  }

  // Commitments endpoints
  async createCommitment(commitmentData: any) {
    const response = await this.api.post('/commitments/', commitmentData);
    return response.data;
  }

  async getCommitments(skip: number = 0, limit: number = 20) {
    const response = await this.api.get('/commitments/', { params: { skip, limit } });
    return response.data;
  }

  async getCommitment(commitmentId: string) {
    const response = await this.api.get(`/commitments/${commitmentId}`);
    return response.data;
  }

  async updateCommitment(commitmentId: string, updateData: any) {
    const response = await this.api.put(`/commitments/${commitmentId}`, updateData);
    return response.data;
  }

  async deleteCommitment(commitmentId: string) {
    await this.api.delete(`/commitments/${commitmentId}`);
  }

  // Reviews endpoints
  async createReview(reviewData: any) {
    const response = await this.api.post('/reviews/', reviewData);
    return response.data;
  }

  async getReviews(skip: number = 0, limit: number = 20) {
    const response = await this.api.get('/reviews/', { params: { skip, limit } });
    return response.data;
  }

  async getUserReviews(userId: string) {
    const response = await this.api.get(`/reviews/user/${userId}/received`);
    return response.data;
  }

  // Users endpoints
  async getUser(userId: string) {
    const response = await this.api.get(`/users/${userId}`);
    return response.data;
  }

  async updateUser(userId: string, updateData: any) {
    const response = await this.api.put(`/users/${userId}`, updateData);
    return response.data;
  }

  async deleteUser(userId: string) {
    await this.api.delete(`/users/${userId}`);
  }
}

export default new ApiClient();
