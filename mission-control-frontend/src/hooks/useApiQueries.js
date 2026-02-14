import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../services/api.js';
import { isRetryableError } from '../services/apiClient.js';

// Query keys
export const QUERY_KEYS = {
  HEALTH: 'health',
  HEALTH_DETAILED: 'health_detailed',
  AGENTS: 'agents',
  AGENT: 'agent',
  AGENT_MISSIONS: 'agent_missions',
  MISSIONS: 'missions', 
  MISSION: 'mission',
  MISSION_PROGRESS: 'mission_progress',
  COMMENTS: 'comments',
  COMMENT: 'comment',
};

// Default query options
const defaultQueryOptions = {
  retry: (failureCount, error) => {
    if (failureCount >= 3) return false;
    return isRetryableError(error);
  },
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  staleTime: 30000, // 30 seconds
  cacheTime: 300000, // 5 minutes
};

// Health Hooks
export function useHealthStatus() {
  return useQuery(
    QUERY_KEYS.HEALTH,
    () => api.health.getStatus().then(res => res.data),
    {
      ...defaultQueryOptions,
      refetchInterval: 30000, // Refetch every 30 seconds
      refetchIntervalInBackground: true,
    }
  );
}

export function useDetailedHealthStatus() {
  return useQuery(
    QUERY_KEYS.HEALTH_DETAILED,
    () => api.health.getDetailedStatus().then(res => res.data),
    {
      ...defaultQueryOptions,
      enabled: false, // Manual fetch only
    }
  );
}

// Agents Hooks
export function useAgents(params = {}) {
  return useQuery(
    [QUERY_KEYS.AGENTS, params],
    () => api.agents.getAll(params).then(res => res.data),
    {
      ...defaultQueryOptions,
      keepPreviousData: true,
    }
  );
}

export function useAgent(id, enabled = true) {
  return useQuery(
    [QUERY_KEYS.AGENT, id],
    () => api.agents.getById(id).then(res => res.data),
    {
      ...defaultQueryOptions,
      enabled: enabled && !!id,
    }
  );
}

export function useAgentMissions(agentId, params = {}) {
  return useQuery(
    [QUERY_KEYS.AGENT_MISSIONS, agentId, params],
    () => api.agents.getMissions(agentId, params).then(res => res.data),
    {
      ...defaultQueryOptions,
      enabled: !!agentId,
      keepPreviousData: true,
    }
  );
}

// Missions Hooks
export function useMissions(params = {}) {
  return useQuery(
    [QUERY_KEYS.MISSIONS, params],
    () => api.missions.getAll(params).then(res => res.data),
    {
      ...defaultQueryOptions,
      keepPreviousData: true,
    }
  );
}

export function useMission(id, enabled = true) {
  return useQuery(
    [QUERY_KEYS.MISSION, id],
    () => api.missions.getById(id).then(res => res.data),
    {
      ...defaultQueryOptions,
      enabled: enabled && !!id,
    }
  );
}

export function useMissionProgress(id, enabled = true) {
  return useQuery(
    [QUERY_KEYS.MISSION_PROGRESS, id],
    () => api.missions.getProgress(id).then(res => res.data),
    {
      ...defaultQueryOptions,
      enabled: enabled && !!id,
      refetchInterval: 5000, // Refetch every 5 seconds for real-time progress
    }
  );
}

// Comments Hooks
export function useComments(params = {}) {
  return useQuery(
    [QUERY_KEYS.COMMENTS, params],
    () => api.comments.getAll(params).then(res => res.data),
    {
      ...defaultQueryOptions,
      keepPreviousData: true,
    }
  );
}

export function useComment(id, enabled = true) {
  return useQuery(
    [QUERY_KEYS.COMMENT, id],
    () => api.comments.getById(id).then(res => res.data),
    {
      ...defaultQueryOptions,
      enabled: enabled && !!id,
    }
  );
}

// Mutation Hooks
export function useCreateAgent() {
  const queryClient = useQueryClient();
  
  return useMutation(api.agents.create, {
    onSuccess: (response) => {
      queryClient.invalidateQueries(QUERY_KEYS.AGENTS);
      queryClient.setQueryData([QUERY_KEYS.AGENT, response.data.data.id], response.data);
    },
  });
}

export function useUpdateAgent() {
  const queryClient = useQueryClient();
  
  return useMutation(
    ({ id, data }) => api.agents.update(id, data),
    {
      onSuccess: (response, { id }) => {
        queryClient.invalidateQueries(QUERY_KEYS.AGENTS);
        queryClient.setQueryData([QUERY_KEYS.AGENT, id], response.data);
        queryClient.invalidateQueries([QUERY_KEYS.AGENT_MISSIONS, id]);
      },
    }
  );
}

export function useDeleteAgent() {
  const queryClient = useQueryClient();
  
  return useMutation(api.agents.delete, {
    onSuccess: (response, id) => {
      queryClient.invalidateQueries(QUERY_KEYS.AGENTS);
      queryClient.removeQueries([QUERY_KEYS.AGENT, id]);
      queryClient.removeQueries([QUERY_KEYS.AGENT_MISSIONS, id]);
    },
  });
}

export function useCreateMission() {
  const queryClient = useQueryClient();
  
  return useMutation(api.missions.create, {
    onSuccess: (response) => {
      queryClient.invalidateQueries(QUERY_KEYS.MISSIONS);
      queryClient.setQueryData([QUERY_KEYS.MISSION, response.data.data.id], response.data);
      
      // Invalidate agent missions if agent is assigned
      if (response.data.data.agentId) {
        queryClient.invalidateQueries([QUERY_KEYS.AGENT_MISSIONS, response.data.data.agentId]);
      }
    },
  });
}

export function useUpdateMission() {
  const queryClient = useQueryClient();
  
  return useMutation(
    ({ id, data }) => api.missions.update(id, data),
    {
      onSuccess: (response, { id }) => {
        queryClient.invalidateQueries(QUERY_KEYS.MISSIONS);
        queryClient.setQueryData([QUERY_KEYS.MISSION, id], response.data);
        queryClient.invalidateQueries([QUERY_KEYS.MISSION_PROGRESS, id]);
        
        // Invalidate agent missions if agent is assigned
        if (response.data.data.agentId) {
          queryClient.invalidateQueries([QUERY_KEYS.AGENT_MISSIONS, response.data.data.agentId]);
        }
      },
    }
  );
}

export function useDeleteMission() {
  const queryClient = useQueryClient();
  
  return useMutation(api.missions.delete, {
    onSuccess: (response, id) => {
      queryClient.invalidateQueries(QUERY_KEYS.MISSIONS);
      queryClient.removeQueries([QUERY_KEYS.MISSION, id]);
      queryClient.removeQueries([QUERY_KEYS.MISSION_PROGRESS, id]);
    },
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  
  return useMutation(api.comments.create, {
    onSuccess: (response) => {
      queryClient.invalidateQueries(QUERY_KEYS.COMMENTS);
      queryClient.setQueryData([QUERY_KEYS.COMMENT, response.data.data.id], response.data);
      
      // Invalidate related data
      if (response.data.data.agentId) {
        queryClient.invalidateQueries([QUERY_KEYS.AGENT, response.data.data.agentId]);
      }
      if (response.data.data.missionId) {
        queryClient.invalidateQueries([QUERY_KEYS.MISSION, response.data.data.missionId]);
      }
    },
  });
}

// Bulk invalidation helper
export function useInvalidateQueries() {
  const queryClient = useQueryClient();
  
  return {
    invalidateAll: () => {
      queryClient.invalidateQueries();
    },
    invalidateAgents: () => {
      queryClient.invalidateQueries(QUERY_KEYS.AGENTS);
    },
    invalidateMissions: () => {
      queryClient.invalidateQueries(QUERY_KEYS.MISSIONS);
    },
    invalidateComments: () => {
      queryClient.invalidateQueries(QUERY_KEYS.COMMENTS);
    },
    invalidateHealth: () => {
      queryClient.invalidateQueries(QUERY_KEYS.HEALTH);
    },
  };
}