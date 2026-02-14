import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { AuthService } from '../services/auth';

const authService = new AuthService();

export const useAuthStore = create(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // State
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        
        // Actions
        login: async (credentials) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await authService.login(credentials);
            const { user, tokens } = response;
            
            set({
              user,
              tokens,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            
            return response;
          } catch (error) {
            set({
              error: error.message || 'Login failed',
              isLoading: false,
            });
            throw error;
          }
        },

        register: async (userData) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await authService.register(userData);
            const { user, tokens } = response;
            
            set({
              user,
              tokens,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            
            return response;
          } catch (error) {
            set({
              error: error.message || 'Registration failed',
              isLoading: false,
            });
            throw error;
          }
        },

        logout: async () => {
          set({ isLoading: true });
          
          try {
            const { tokens } = get();
            if (tokens?.refreshToken) {
              await authService.logout({ refreshToken: tokens.refreshToken });
            }
          } catch (error) {
            console.warn('Logout error:', error);
          }
          
          set({
            user: null,
            tokens: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        },

        logoutAll: async () => {
          set({ isLoading: true });
          
          try {
            await authService.logoutAll();
          } catch (error) {
            console.warn('Logout all error:', error);
          }
          
          set({
            user: null,
            tokens: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        },

        refreshTokens: async () => {
          const { tokens } = get();
          
          if (!tokens?.refreshToken) {
            throw new Error('No refresh token available');
          }
          
          try {
            const newTokens = await authService.refreshToken(tokens.refreshToken);
            
            set({
              tokens: newTokens,
              error: null,
            });
            
            return newTokens;
          } catch (error) {
            // Refresh failed, logout user
            set({
              user: null,
              tokens: null,
              isAuthenticated: false,
              error: 'Session expired',
            });
            throw error;
          }
        },

        updateProfile: async (profileData) => {
          set({ isLoading: true, error: null });
          
          try {
            const updatedUser = await authService.updateProfile(profileData);
            
            set({
              user: updatedUser,
              isLoading: false,
              error: null,
            });
            
            return updatedUser;
          } catch (error) {
            set({
              error: error.message || 'Profile update failed',
              isLoading: false,
            });
            throw error;
          }
        },

        changePassword: async (passwordData) => {
          set({ isLoading: true, error: null });
          
          try {
            await authService.changePassword(passwordData);
            
            // Force logout after password change for security
            set({
              user: null,
              tokens: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            });
            
            return true;
          } catch (error) {
            set({
              error: error.message || 'Password change failed',
              isLoading: false,
            });
            throw error;
          }
        },

        forgotPassword: async (email) => {
          set({ isLoading: true, error: null });
          
          try {
            await authService.forgotPassword(email);
            set({ isLoading: false });
            return true;
          } catch (error) {
            set({
              error: error.message || 'Failed to send reset email',
              isLoading: false,
            });
            throw error;
          }
        },

        resetPassword: async (token, password) => {
          set({ isLoading: true, error: null });
          
          try {
            await authService.resetPassword(token, password);
            set({ isLoading: false });
            return true;
          } catch (error) {
            set({
              error: error.message || 'Password reset failed',
              isLoading: false,
            });
            throw error;
          }
        },

        validateToken: async () => {
          const { tokens } = get();
          
          if (!tokens?.accessToken) {
            return false;
          }
          
          try {
            const userData = await authService.validateToken();
            
            if (userData) {
              set({
                user: userData.user,
                isAuthenticated: true,
                error: null,
              });
              return true;
            }
            
            return false;
          } catch (error) {
            console.warn('Token validation failed:', error);
            return false;
          }
        },

        clearError: () => {
          set({ error: null });
        },

        // OAuth methods
        initiateOAuth: (provider) => {
          window.location.href = `/api/auth/oauth/${provider}`;
        },

        handleOAuthCallback: async (provider, code, state) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await authService.oauthCallback(provider, code, state);
            const { user, tokens } = response;
            
            set({
              user,
              tokens,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            
            return response;
          } catch (error) {
            set({
              error: error.message || 'OAuth authentication failed',
              isLoading: false,
            });
            throw error;
          }
        },

        // Utilities
        hasPermission: (resource, action) => {
          const { user } = get();
          const permission = `${resource}:${action}`;
          return user?.permissions?.includes(permission) || false;
        },

        hasRole: (roleName) => {
          const { user } = get();
          return user?.roles?.includes(roleName) || false;
        },

        isAdmin: () => {
          const { hasRole } = get();
          return hasRole('admin');
        },

        getAccessToken: () => {
          const { tokens } = get();
          return tokens?.accessToken || null;
        },
      }),
      {
        name: 'mission-control-auth', // localStorage key
        partialize: (state) => ({
          user: state.user,
          tokens: state.tokens,
          isAuthenticated: state.isAuthenticated,
        }),
        onRehydrateStorage: () => (state) => {
          // Validate tokens on app start
          if (state?.tokens?.accessToken) {
            state.validateToken().catch(() => {
              // Clear invalid auth state
              state.logout();
            });
          }
        },
      }
    )
  )
);

// Subscribe to auth state changes for automatic token refresh
useAuthStore.subscribe(
  (state) => state.tokens,
  (tokens, prevTokens) => {
    if (tokens?.accessToken && tokens !== prevTokens) {
      // Set up automatic token refresh before expiration
      const expiresIn = (tokens.expiresIn || 15 * 60) * 1000; // Convert to milliseconds
      const refreshTime = expiresIn - 60 * 1000; // Refresh 1 minute before expiry
      
      if (refreshTime > 0) {
        setTimeout(() => {
          const currentState = useAuthStore.getState();
          if (currentState.isAuthenticated && currentState.tokens?.refreshToken) {
            currentState.refreshTokens().catch(() => {
              // Silent refresh failed, user will need to login again
            });
          }
        }, refreshTime);
      }
    }
  }
);

export default useAuthStore;