import { useEffect, useRef, useCallback, useState } from 'react';
import { useQueryClient } from 'react-query';
import socketClient from '../services/socketClient.js';

// Main hook for socket connection management
export function useSocket() {
  const isConnectedRef = useRef(false);

  useEffect(() => {
    // Connect on mount
    socketClient.connect();
    
    // Track connection status
    const handleConnection = (data) => {
      isConnectedRef.current = data.status === 'connected' || data.status === 'reconnected';
    };
    
    const cleanup = socketClient.on('connection', handleConnection);

    // Cleanup on unmount
    return () => {
      cleanup();
      socketClient.disconnect();
    };
  }, []);

  const joinRoom = useCallback((room) => {
    socketClient.joinRoom(room);
  }, []);

  const leaveRoom = useCallback((room) => {
    socketClient.leaveRoom(room);
  }, []);

  const ping = useCallback((callback) => {
    socketClient.ping(callback);
  }, []);

  const getStatus = useCallback(() => {
    return socketClient.getStatus();
  }, []);

  return {
    joinRoom,
    leaveRoom,
    ping,
    getStatus,
    isConnected: isConnectedRef.current,
  };
}

// Hook for connection status monitoring
export function useSocketConnection() {
  const [connectionState, setConnectionState] = useState({
    status: 'disconnected',
    socketId: null,
    error: null,
    attempts: 0,
  });

  useEffect(() => {
    const cleanup = socketClient.on('connection', (data) => {
      setConnectionState(prev => ({
        ...prev,
        status: data.status,
        socketId: data.socketId || prev.socketId,
        error: data.error || null,
        attempts: data.attempts || 0,
      }));
    });

    // Get initial status
    const status = socketClient.getStatus();
    if (status.connected) {
      setConnectionState(prev => ({
        ...prev,
        status: 'connected',
        socketId: status.socketId,
      }));
    }

    return cleanup;
  }, []);

  return connectionState;
}

// Hook for listening to specific socket events
export function useSocketEvent(event, handler, dependencies = []) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const wrappedHandler = (data) => {
      handlerRef.current(data);
    };

    const cleanup = socketClient.on(event, wrappedHandler);
    return cleanup;
  }, dependencies);
}

// Hook for agent status updates
export function useAgentStatusUpdates(agentId, onUpdate) {
  const queryClient = useQueryClient();

  useSocketEvent(
    'agentStatusUpdate',
    useCallback((data) => {
      if (!agentId || data.agentId === agentId) {
        // Update React Query cache
        queryClient.setQueryData(['agent', data.agentId], (oldData) => {
          if (oldData?.data) {
            return {
              ...oldData,
              data: {
                ...oldData.data,
                status: data.status,
                lastSeen: new Date().toISOString(),
              },
            };
          }
          return oldData;
        });

        // Call custom handler
        if (onUpdate) {
          onUpdate(data);
        }
      }
    }, [agentId, onUpdate, queryClient]),
    [agentId]
  );

  // Join/leave agent room based on agentId
  useEffect(() => {
    if (agentId) {
      socketClient.joinRoom(`agent:${agentId}`);
      return () => {
        socketClient.leaveRoom(`agent:${agentId}`);
      };
    }
  }, [agentId]);
}

// Hook for mission updates
export function useMissionUpdates(missionId, onUpdate) {
  const queryClient = useQueryClient();

  useSocketEvent(
    'missionUpdate',
    useCallback((data) => {
      if (!missionId || data.missionId === missionId) {
        // Update React Query cache for mission
        queryClient.setQueryData(['mission', data.missionId], (oldData) => {
          if (oldData?.data) {
            return {
              ...oldData,
              data: {
                ...oldData.data,
                status: data.status,
                progress: data.progress !== undefined ? data.progress : oldData.data.progress,
                updatedAt: new Date().toISOString(),
              },
            };
          }
          return oldData;
        });

        // Update mission progress cache
        queryClient.setQueryData(['mission_progress', data.missionId], (oldData) => {
          if (oldData?.data) {
            return {
              ...oldData,
              data: {
                ...oldData.data,
                status: data.status,
                progress: data.progress !== undefined ? data.progress : oldData.data.progress,
              },
            };
          }
          return oldData;
        });

        // Invalidate missions list to ensure consistency
        queryClient.invalidateQueries(['missions']);

        // Call custom handler
        if (onUpdate) {
          onUpdate(data);
        }
      }
    }, [missionId, onUpdate, queryClient]),
    [missionId]
  );

  // Join/leave mission room based on missionId
  useEffect(() => {
    if (missionId) {
      socketClient.joinRoom(`mission:${missionId}`);
      return () => {
        socketClient.leaveRoom(`mission:${missionId}`);
      };
    }
  }, [missionId]);
}

// Hook for new comment notifications
export function useCommentUpdates(onNewComment) {
  const queryClient = useQueryClient();

  useSocketEvent(
    'newComment',
    useCallback((data) => {
      // Invalidate comments cache
      queryClient.invalidateQueries(['comments']);

      // Invalidate related agent/mission data
      if (data.agentId) {
        queryClient.invalidateQueries(['agent', data.agentId]);
      }
      if (data.missionId) {
        queryClient.invalidateQueries(['mission', data.missionId]);
      }

      // Call custom handler
      if (onNewComment) {
        onNewComment(data);
      }
    }, [onNewComment, queryClient]),
    []
  );
}

// Hook for system notifications
export function useSystemNotifications(onNotification) {
  const [notifications, setNotifications] = useState([]);
  const maxNotifications = 10;

  useSocketEvent(
    'systemNotification',
    useCallback((data) => {
      const notification = {
        id: `${Date.now()}-${Math.random()}`,
        ...data,
        timestamp: data.timestamp || new Date().toISOString(),
        read: false,
      };

      setNotifications(prev => {
        const updated = [notification, ...prev].slice(0, maxNotifications);
        return updated;
      });

      // Call custom handler
      if (onNotification) {
        onNotification(notification);
      }
    }, [onNotification]),
    []
  );

  const markAsRead = useCallback((id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const clearRead = useCallback(() => {
    setNotifications(prev => prev.filter(notif => !notif.read));
  }, []);

  return {
    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
    markAsRead,
    clearAll,
    clearRead,
  };
}

// Hook for comprehensive real-time data synchronization
export function useRealTimeSync() {
  const queryClient = useQueryClient();

  // Agent status updates
  useSocketEvent('agentStatusUpdate', (data) => {
    queryClient.invalidateQueries(['agents']);
  }, []);

  // Mission updates
  useSocketEvent('missionUpdate', (data) => {
    queryClient.invalidateQueries(['missions']);
  }, []);

  // Comment updates
  useSocketEvent('newComment', (data) => {
    queryClient.invalidateQueries(['comments']);
  }, []);

  return {
    isActive: true,
  };
}