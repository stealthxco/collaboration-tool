import apiClient, { retryRequest } from './apiClient.js';
import { ENDPOINTS } from '../config/api.js';

// Health API
export const healthApi = {
  getStatus: () => retryRequest(() => apiClient.get(ENDPOINTS.HEALTH)),
  getDetailedStatus: () => retryRequest(() => apiClient.get(ENDPOINTS.HEALTH_DETAILED)),
};

// Agents API
export const agentsApi = {
  getAll: (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value);
      }
    });
    
    const url = queryParams.toString() 
      ? `${ENDPOINTS.AGENTS}?${queryParams.toString()}`
      : ENDPOINTS.AGENTS;
      
    return retryRequest(() => apiClient.get(url));
  },
  
  getById: (id) => retryRequest(() => apiClient.get(ENDPOINTS.AGENT_BY_ID(id))),
  
  create: (data) => apiClient.post(ENDPOINTS.AGENTS, data),
  
  update: (id, data) => apiClient.patch(ENDPOINTS.AGENT_BY_ID(id), data),
  
  delete: (id) => apiClient.delete(ENDPOINTS.AGENT_BY_ID(id)),
  
  // Get agent missions
  getMissions: (id, params = {}) => {
    const queryParams = new URLSearchParams({ agentId: id, ...params });
    return retryRequest(() => apiClient.get(`${ENDPOINTS.MISSIONS}?${queryParams.toString()}`));
  },
};

// Missions API
export const missionsApi = {
  getAll: (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value);
      }
    });
    
    const url = queryParams.toString() 
      ? `${ENDPOINTS.MISSIONS}?${queryParams.toString()}`
      : ENDPOINTS.MISSIONS;
      
    return retryRequest(() => apiClient.get(url));
  },
  
  getById: (id) => retryRequest(() => apiClient.get(ENDPOINTS.MISSION_BY_ID(id))),
  
  getProgress: (id) => retryRequest(() => apiClient.get(ENDPOINTS.MISSION_PROGRESS(id))),
  
  create: (data) => apiClient.post(ENDPOINTS.MISSIONS, data),
  
  update: (id, data) => apiClient.patch(ENDPOINTS.MISSION_BY_ID(id), data),
  
  delete: (id) => apiClient.delete(ENDPOINTS.MISSION_BY_ID(id)),
  
  // Update mission progress
  updateProgress: (id, progress) => apiClient.patch(ENDPOINTS.MISSION_BY_ID(id), { progress }),
  
  // Update mission status
  updateStatus: (id, status) => apiClient.patch(ENDPOINTS.MISSION_BY_ID(id), { status }),
};

// Comments API
export const commentsApi = {
  getAll: (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value);
      }
    });
    
    const url = queryParams.toString() 
      ? `${ENDPOINTS.COMMENTS}?${queryParams.toString()}`
      : ENDPOINTS.COMMENTS;
      
    return retryRequest(() => apiClient.get(url));
  },
  
  getById: (id) => retryRequest(() => apiClient.get(ENDPOINTS.COMMENT_BY_ID(id))),
  
  create: (data) => apiClient.post(ENDPOINTS.COMMENTS, data),
  
  update: (id, data) => apiClient.patch(ENDPOINTS.COMMENT_BY_ID(id), data),
  
  delete: (id) => apiClient.delete(ENDPOINTS.COMMENT_BY_ID(id)),
  
  // Get comments for specific agent
  getByAgent: (agentId, params = {}) => {
    return commentsApi.getAll({ agentId, ...params });
  },
  
  // Get comments for specific mission
  getByMission: (missionId, params = {}) => {
    return commentsApi.getAll({ missionId, ...params });
  },
};

// Export all APIs
export const api = {
  health: healthApi,
  agents: agentsApi,
  missions: missionsApi,
  comments: commentsApi,
};