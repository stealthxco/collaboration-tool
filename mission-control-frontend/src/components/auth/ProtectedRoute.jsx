import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider';
import { Loader2 } from 'lucide-react';

/**
 * ProtectedRoute component that requires authentication
 */
export const ProtectedRoute = ({ children, redirectTo = '/login' }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 mx-auto text-blue-600" />
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to={redirectTo}
        state={{ from: location }}
        replace
      />
    );
  }

  return children;
};

/**
 * PublicRoute component that redirects authenticated users
 */
export const PublicRoute = ({ children, redirectTo = '/dashboard' }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 mx-auto text-blue-600" />
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

/**
 * PermissionGuard component that requires specific permissions
 */
export const PermissionGuard = ({ 
  children, 
  resource, 
  action, 
  fallback = null,
  redirectTo = '/unauthorized'
}) => {
  const { hasPermission, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="animate-spin h-6 w-6 text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasPermission(resource, action)) {
    if (fallback) {
      return fallback;
    }
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

/**
 * RoleGuard component that requires specific roles
 */
export const RoleGuard = ({ 
  children, 
  roles = [], 
  requireAll = false,
  fallback = null,
  redirectTo = '/unauthorized'
}) => {
  const { hasRole, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="animate-spin h-6 w-6 text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const hasAccess = requireAll 
    ? roles.every(role => hasRole(role))
    : roles.some(role => hasRole(role));

  if (!hasAccess) {
    if (fallback) {
      return fallback;
    }
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

/**
 * AdminRoute component that requires admin role
 */
export const AdminRoute = ({ children, fallback = null, redirectTo = '/unauthorized' }) => {
  return (
    <RoleGuard roles={['admin']} fallback={fallback} redirectTo={redirectTo}>
      {children}
    </RoleGuard>
  );
};

/**
 * ConditionalComponent component that renders based on permissions/roles
 */
export const ConditionalComponent = ({ 
  children, 
  resource, 
  action, 
  role,
  fallback = null,
  show = true
}) => {
  const { hasPermission, hasRole, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return fallback;
  }

  let hasAccess = true;

  // Check permission if specified
  if (resource && action) {
    hasAccess = hasAccess && hasPermission(resource, action);
  }

  // Check role if specified
  if (role) {
    hasAccess = hasAccess && hasRole(role);
  }

  // Apply show condition
  hasAccess = hasAccess && show;

  return hasAccess ? children : fallback;
};

export default ProtectedRoute;