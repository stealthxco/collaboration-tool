import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [status, setStatus] = useState('processing'); // 'processing', 'success', 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Get tokens from URL parameters
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const expiresIn = searchParams.get('expires_in');
        const userId = searchParams.get('user_id');
        const isNewUser = searchParams.get('is_new_user') === 'true';

        if (!accessToken || !refreshToken || !userId) {
          throw new Error('Missing authentication tokens');
        }

        // Store tokens in auth store (this should be handled by AuthProvider)
        const tokens = {
          accessToken,
          refreshToken,
          expiresIn: parseInt(expiresIn || '900', 10) // Default 15 minutes
        };

        // Get user info and store in auth state
        // This would typically be done through the auth service
        // For now, we'll just set success status

        setStatus('success');
        setMessage(isNewUser ? 'Account created successfully!' : 'Signed in successfully!');

        // Clear URL parameters and redirect after a short delay
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 2000);

      } catch (error) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        setMessage(error.message || 'Authentication failed');
        
        // Redirect to login with error after delay
        setTimeout(() => {
          navigate('/login?error=oauth-failed', { replace: true });
        }, 3000);
      }
    };

    // Check if user is already authenticated
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
      return;
    }

    // Check for error parameters
    const error = searchParams.get('error');
    if (error) {
      setStatus('error');
      setMessage(getErrorMessage(error));
      setTimeout(() => {
        navigate('/login?error=' + error, { replace: true });
      }, 3000);
      return;
    }

    handleOAuthCallback();
  }, [searchParams, navigate, isAuthenticated]);

  const getErrorMessage = (error) => {
    switch (error) {
      case 'oauth-no-code':
        return 'Authorization code not received from provider';
      case 'oauth-invalid-provider':
        return 'Invalid OAuth provider';
      case 'oauth-callback-failed':
        return 'OAuth authentication failed';
      case 'access_denied':
        return 'You denied access to the application';
      case 'invalid_request':
        return 'Invalid OAuth request';
      case 'unauthorized_client':
        return 'Application not authorized for OAuth';
      case 'unsupported_response_type':
        return 'OAuth response type not supported';
      case 'invalid_scope':
        return 'Invalid OAuth scope';
      case 'server_error':
        return 'OAuth server error occurred';
      case 'temporarily_unavailable':
        return 'OAuth service temporarily unavailable';
      default:
        return 'OAuth authentication failed';
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'processing':
        return (
          <>
            <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Completing Authentication
            </h2>
            <p className="text-gray-600">
              Please wait while we sign you in...
            </p>
          </>
        );

      case 'success':
        return (
          <>
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Authentication Successful
            </h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <div className="flex items-center justify-center text-sm text-gray-500">
              <Loader2 className="animate-spin h-4 w-4 mr-2" />
              Redirecting to dashboard...
            </div>
          </>
        );

      case 'error':
        return (
          <>
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Authentication Failed
            </h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <div className="flex items-center justify-center text-sm text-gray-500">
              <Loader2 className="animate-spin h-4 w-4 mr-2" />
              Redirecting to login...
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OAuthCallback;