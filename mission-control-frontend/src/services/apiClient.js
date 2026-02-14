import axios from 'axios';
import { API_CONFIG, HTTP_STATUS, ERROR_TYPES } from '../config/api.js';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth tokens, logging, etc.
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request timestamp for debugging
    config.metadata = { startTime: new Date() };
    
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, config.data);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling common responses and errors
apiClient.interceptors.response.use(
  (response) => {
    // Calculate request duration
    const duration = new Date() - response.config.metadata.startTime;
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`, response.data);
    
    return response;
  },
  (error) => {
    const duration = error.config?.metadata ? new Date() - error.config.metadata.startTime : 0;
    console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url} (${duration}ms)`, error.response?.data || error.message);
    
    // Transform error into a consistent format
    const transformedError = transformApiError(error);
    return Promise.reject(transformedError);
  }
);

// Transform API errors into consistent format
function transformApiError(error) {
  const baseError = {
    message: 'An unexpected error occurred',
    type: ERROR_TYPES.UNKNOWN,
    status: null,
    data: null,
    timestamp: new Date().toISOString(),
  };

  if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
    return {
      ...baseError,
      message: 'Request timeout. Please try again.',
      type: ERROR_TYPES.TIMEOUT,
    };
  }

  if (!error.response) {
    return {
      ...baseError,
      message: 'Network error. Please check your connection.',
      type: ERROR_TYPES.NETWORK,
    };
  }

  const { status, data } = error.response;
  
  switch (status) {
    case HTTP_STATUS.BAD_REQUEST:
      return {
        ...baseError,
        message: data?.error || 'Invalid request data',
        type: ERROR_TYPES.VALIDATION,
        status,
        data,
      };
    
    case HTTP_STATUS.UNAUTHORIZED:
      // Clear auth token on 401
      localStorage.removeItem('auth_token');
      return {
        ...baseError,
        message: 'Authentication required. Please log in.',
        type: ERROR_TYPES.SERVER,
        status,
        data,
      };
    
    case HTTP_STATUS.FORBIDDEN:
      return {
        ...baseError,
        message: 'Access denied. Insufficient permissions.',
        type: ERROR_TYPES.SERVER,
        status,
        data,
      };
    
    case HTTP_STATUS.NOT_FOUND:
      return {
        ...baseError,
        message: data?.error || 'Resource not found',
        type: ERROR_TYPES.SERVER,
        status,
        data,
      };
    
    case HTTP_STATUS.INTERNAL_SERVER_ERROR:
    case HTTP_STATUS.SERVICE_UNAVAILABLE:
      return {
        ...baseError,
        message: data?.error || 'Server error. Please try again later.',
        type: ERROR_TYPES.SERVER,
        status,
        data,
      };
    
    default:
      return {
        ...baseError,
        message: data?.error || `HTTP ${status} error`,
        type: ERROR_TYPES.SERVER,
        status,
        data,
      };
  }
}

// Retry mechanism for failed requests
export async function retryRequest(requestFn, maxAttempts = API_CONFIG.RETRY_ATTEMPTS) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      // Don't retry certain error types
      if (
        error.type === ERROR_TYPES.VALIDATION ||
        error.status === HTTP_STATUS.UNAUTHORIZED ||
        error.status === HTTP_STATUS.FORBIDDEN ||
        error.status === HTTP_STATUS.NOT_FOUND
      ) {
        throw error;
      }
      
      if (attempt < maxAttempts) {
        const delay = API_CONFIG.RETRY_DELAY * Math.pow(2, attempt - 1); // Exponential backoff
        console.log(`🔄 Retrying request in ${delay}ms (attempt ${attempt}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

// Helper to check if error is retryable
export function isRetryableError(error) {
  return (
    error.type === ERROR_TYPES.NETWORK ||
    error.type === ERROR_TYPES.TIMEOUT ||
    (error.type === ERROR_TYPES.SERVER && [HTTP_STATUS.INTERNAL_SERVER_ERROR, HTTP_STATUS.SERVICE_UNAVAILABLE].includes(error.status))
  );
}

export default apiClient;