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
      }
      return config;
    });

    // Handle token refresh on 401
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
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
    try {
      const response = await this.api.post('/auth/login', {
        phone_number: phoneNumber,
        password,
      });

      const { access_token, user_id, first_name, last_name } = response.data;
      
      if (!access_token && !response.data.message) {
        throw new Error('No access_token in login response');
      }

      if (access_token) {
        await this.setAccessToken(access_token);
      }
      
      return { access_token, user_id, first_name, last_name, ...response.data };
    } catch (error: any) {
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
    const response = await this.api.post('/users/register', {
      phone_number: phoneNumber,
      first_name: firstName,
      last_name: lastName,
      email,
      password,
      role: 'both',
    });

    return response.data;
  }

  async getCurrentUser() {
    const response = await this.api.get('/auth/me');
    return response.data;
  }

  async getAccessToken(): Promise<string | null> {
    try {
      let token: string | null = null;
      
      if (isSecureStoreAvailable) {
        token = await SecureStore.getItemAsync(TOKEN_KEY);
      } else {
        token = await AsyncStorage.getItem(TOKEN_KEY);
      }
      
      return token;
    } catch (error) {
      return null;
    }
  }

  async setAccessToken(token: string): Promise<void> {
    try {
      if (isSecureStoreAvailable) {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
      } else {
        await AsyncStorage.setItem(TOKEN_KEY, token);
      }
    } catch (error) {
      throw error;
    }
  }

  async refreshAccessToken(): Promise<string> {
    try {
      const response = await this.api.post('/auth/token');
      const { access_token } = response.data;
      await this.setAccessToken(access_token);
      return access_token;
    } catch (error: any) {
      await this.clearTokens();
      throw error;
    }
  }

  async clearTokens() {
    try {
      if (isSecureStoreAvailable) {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      } else {
        await AsyncStorage.removeItem(TOKEN_KEY);
      }
    } catch (error) {
      // Silently fail
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
  async createCommitment(requestId: string) {
    const response = await this.api.post('/commitments/', null, {
      params: {
        request_id: requestId,
      },
    });
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

  // Messages endpoints
  async sendMessage(commitmentId: string, text: string) {
    const response = await this.api.post(`/messages/${commitmentId}`, {
      text,
    });
    return response.data;
  }

  async getMessages(commitmentId: string, skip: number = 0, limit: number = 50) {
    const response = await this.api.get(`/messages/${commitmentId}`, {
      params: { skip, limit },
    });
    return response.data;
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

  async uploadUserPhoto(userId: string, photoUri: string) {
    const formData = new FormData();
    formData.append('file', {
      uri: photoUri,
      type: 'image/jpeg',
      name: 'profile.jpg',
    } as any);

    const response = await this.api.post(`/users/${userId}/upload-photo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async deleteUser(userId: string) {
    await this.api.delete(`/users/${userId}`);
  }
}

export default new ApiClient();
