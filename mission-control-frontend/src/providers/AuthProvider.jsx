import React, { createContext, useContext, useEffect } from 'react';
import { useAuthStore } from '../store/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const authStore = useAuthStore();

  // Initialize authentication state on app start
  useEffect(() => {
    const initializeAuth = async () => {
      // Check if user has valid tokens
      if (authStore.tokens?.accessToken) {
        try {
          // Validate current session
          await authStore.validateToken();
        } catch (error) {
          console.warn('Session validation failed, clearing auth state');
          authStore.logout();
        }
      }
    };

    initializeAuth();
  }, []);

  // Auto-refresh tokens when they're about to expire
  useEffect(() => {
    if (!authStore.isAuthenticated || !authStore.tokens?.refreshToken) {
      return;
    }

    const refreshInterval = setInterval(async () => {
      try {
        await authStore.refreshTokens();
      } catch (error) {
        console.warn('Token refresh failed:', error);
        authStore.logout();
      }
    }, 14 * 60 * 1000); // Refresh every 14 minutes (tokens expire in 15)

    return () => clearInterval(refreshInterval);
  }, [authStore.isAuthenticated, authStore.tokens]);

  const contextValue = {
    // State
    user: authStore.user,
    isAuthenticated: authStore.isAuthenticated,
    isLoading: authStore.isLoading,
    error: authStore.error,
    
    // Actions
    login: authStore.login,
    register: authStore.register,
    logout: authStore.logout,
    logoutAll: authStore.logoutAll,
    updateProfile: authStore.updateProfile,
    changePassword: authStore.changePassword,
    forgotPassword: authStore.forgotPassword,
    resetPassword: authStore.resetPassword,
    clearError: authStore.clearError,
    
    // OAuth
    initiateOAuth: authStore.initiateOAuth,
    handleOAuthCallback: authStore.handleOAuthCallback,
    
    // Utilities
    hasPermission: authStore.hasPermission,
    hasRole: authStore.hasRole,
    isAdmin: authStore.isAdmin,
    getAccessToken: authStore.getAccessToken,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;