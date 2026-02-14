// API configuration and base setup
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

// API endpoints
export const ENDPOINTS = {
  // Health
  HEALTH: '/health',
  HEALTH_DETAILED: '/health/detailed',
  
  // Agents
  AGENTS: '/api/agents',
  AGENT_BY_ID: (id) => `/api/agents/${id}`,
  
  // Missions
  MISSIONS: '/api/missions',
  MISSION_BY_ID: (id) => `/api/missions/${id}`,
  MISSION_PROGRESS: (id) => `/api/missions/${id}/progress`,
  
  // Comments
  COMMENTS: '/api/comments',
  COMMENT_BY_ID: (id) => `/api/comments/${id}`,
};

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// Error types
export const ERROR_TYPES = {
  NETWORK: 'NETWORK_ERROR',
  SERVER: 'SERVER_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  TIMEOUT: 'TIMEOUT_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR',
};