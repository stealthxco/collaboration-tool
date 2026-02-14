import axios from 'axios';
import { API_BASE_URL } from '../config/api';

class AuthService {
  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/auth`,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getStoredToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response.data,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = this.getStoredRefreshToken();
            if (refreshToken) {
              const newTokens = await this.refreshToken(refreshToken);
              this.setTokens(newTokens);
              
              // Retry original request with new token
              originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            this.clearTokens();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error.response?.data || error);
      }
    );
  }

  // Token management helpers
  getStoredToken() {
    try {
      const authData = localStorage.getItem('mission-control-auth');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed.state?.tokens?.accessToken;
      }
    } catch (error) {
      console.warn('Error reading stored token:', error);
    }
    return null;
  }

  getStoredRefreshToken() {
    try {
      const authData = localStorage.getItem('mission-control-auth');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed.state?.tokens?.refreshToken;
      }
    } catch (error) {
      console.warn('Error reading stored refresh token:', error);
    }
    return null;
  }

  setTokens(tokens) {
    try {
      const authData = localStorage.getItem('mission-control-auth');
      if (authData) {
        const parsed = JSON.parse(authData);
        parsed.state.tokens = tokens;
        localStorage.setItem('mission-control-auth', JSON.stringify(parsed));
      }
    } catch (error) {
      console.warn('Error storing tokens:', error);
    }
  }

  clearTokens() {
    try {
      localStorage.removeItem('mission-control-auth');
    } catch (error) {
      console.warn('Error clearing tokens:', error);
    }
  }

  // Authentication methods
  async login(credentials) {
    const response = await this.api.post('/login', credentials);
    return response;
  }

  async register(userData) {
    const response = await this.api.post('/register', userData);
    return response;
  }

  async logout(data = {}) {
    try {
      await this.api.post('/logout', data);
    } finally {
      this.clearTokens();
    }
  }

  async logoutAll() {
    try {
      await this.api.post('/logout-all');
    } finally {
      this.clearTokens();
    }
  }

  async refreshToken(refreshToken) {
    // Don't use the intercepted api instance to avoid infinite loops
    const response = await axios.post(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000,
      }
    );
    
    return response.data.tokens;
  }

  async validateToken() {
    const response = await this.api.get('/validate');
    return response;
  }

  async getCurrentUser() {
    const response = await this.api.get('/me');
    return response.user;
  }

  // Profile management
  async updateProfile(profileData) {
    const response = await this.api.patch('/me', profileData);
    return response.user;
  }

  async changePassword(passwordData) {
    const response = await this.api.post('/change-password', passwordData);
    return response;
  }

  // Password reset
  async forgotPassword(email) {
    const response = await this.api.post('/forgot-password', { email });
    return response;
  }

  async resetPassword(token, password) {
    const response = await this.api.post('/reset-password', { token, password });
    return response;
  }

  // OAuth
  async oauthCallback(provider, code, state) {
    const response = await this.api.post(`/oauth/${provider}/callback`, {
      code,
      state,
    });
    return response;
  }

  getOAuthUrl(provider) {
    return `${API_BASE_URL}/auth/oauth/${provider}`;
  }

  // Utility methods
  isTokenExpired(token) {
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  hasValidToken() {
    const token = this.getStoredToken();
    return token && !this.isTokenExpired(token);
  }

  // Permission and role checking
  async checkPermission(resource, action) {
    try {
      const user = await this.getCurrentUser();
      const permission = `${resource}:${action}`;
      return user.permissions?.includes(permission) || false;
    } catch (error) {
      return false;
    }
  }

  async checkRole(roleName) {
    try {
      const user = await this.getCurrentUser();
      return user.roles?.includes(roleName) || false;
    } catch (error) {
      return false;
    }
  }
}

export { AuthService };
export default new AuthService();