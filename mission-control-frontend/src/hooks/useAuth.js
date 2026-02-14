import { useAuth } from '../providers/AuthProvider';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Enhanced authentication hook with additional utilities
 */
export const useAuthActions = () => {
  const auth = useAuth();
  const navigate = useNavigate();

  const loginAndRedirect = useCallback(async (credentials, redirectTo = '/dashboard') => {
    try {
      await auth.login(credentials);
      navigate(redirectTo);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }, [auth.login, navigate]);

  const registerAndRedirect = useCallback(async (userData, redirectTo = '/dashboard') => {
    try {
      await auth.register(userData);
      navigate(redirectTo);
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    }
  }, [auth.register, navigate]);

  const logoutAndRedirect = useCallback(async (redirectTo = '/login') => {
    try {
      await auth.logout();
      navigate(redirectTo);
      return true;
    } catch (error) {
      console.error('Logout failed:', error);
      navigate(redirectTo); // Navigate anyway
      return false;
    }
  }, [auth.logout, navigate]);

  return {
    ...auth,
    loginAndRedirect,
    registerAndRedirect,
    logoutAndRedirect,
  };
};

/**
 * Hook for checking user permissions
 */
export const usePermissions = () => {
  const { hasPermission, hasRole, isAdmin, user } = useAuth();

  const can = useCallback((resource, action) => {
    return hasPermission(resource, action);
  }, [hasPermission]);

  const cannot = useCallback((resource, action) => {
    return !hasPermission(resource, action);
  }, [hasPermission]);

  const isRole = useCallback((roleName) => {
    return hasRole(roleName);
  }, [hasRole]);

  const permissions = user?.permissions || [];
  const roles = user?.roles || [];

  return {
    can,
    cannot,
    hasRole,
    isRole,
    isAdmin,
    permissions,
    roles,
  };
};

/**
 * Hook for user profile management
 */
export const useProfile = () => {
  const { user, updateProfile, changePassword, isLoading, error } = useAuth();

  const updateUserProfile = useCallback(async (profileData) => {
    try {
      await updateProfile(profileData);
      return true;
    } catch (error) {
      console.error('Profile update failed:', error);
      return false;
    }
  }, [updateProfile]);

  const changeUserPassword = useCallback(async (passwordData) => {
    try {
      await changePassword(passwordData);
      return true;
    } catch (error) {
      console.error('Password change failed:', error);
      return false;
    }
  }, [changePassword]);

  return {
    user,
    updateUserProfile,
    changeUserPassword,
    isLoading,
    error,
  };
};

/**
 * Hook for password reset functionality
 */
export const usePasswordReset = () => {
  const { forgotPassword, resetPassword, isLoading, error } = useAuth();
  const navigate = useNavigate();

  const requestPasswordReset = useCallback(async (email) => {
    try {
      await forgotPassword(email);
      return true;
    } catch (error) {
      console.error('Password reset request failed:', error);
      return false;
    }
  }, [forgotPassword]);

  const confirmPasswordReset = useCallback(async (token, password) => {
    try {
      await resetPassword(token, password);
      navigate('/login?message=password-reset-success');
      return true;
    } catch (error) {
      console.error('Password reset failed:', error);
      return false;
    }
  }, [resetPassword, navigate]);

  return {
    requestPasswordReset,
    confirmPasswordReset,
    isLoading,
    error,
  };
};

/**
 * Hook for OAuth authentication
 */
export const useOAuth = () => {
  const { initiateOAuth, handleOAuthCallback, isLoading, error } = useAuth();
  const navigate = useNavigate();

  const loginWithOAuth = useCallback((provider) => {
    initiateOAuth(provider);
  }, [initiateOAuth]);

  const handleOAuthReturn = useCallback(async (provider, code, state, redirectTo = '/dashboard') => {
    try {
      await handleOAuthCallback(provider, code, state);
      navigate(redirectTo);
      return true;
    } catch (error) {
      console.error('OAuth callback failed:', error);
      navigate('/login?error=oauth-failed');
      return false;
    }
  }, [handleOAuthCallback, navigate]);

  return {
    loginWithOAuth,
    handleOAuthReturn,
    isLoading,
    error,
  };
};

export default useAuthActions;