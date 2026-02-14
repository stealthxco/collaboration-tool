import { useEffect } from 'react';
import { useSocket, useSocketConnection, useSocketEvent, useSystemNotifications, useRealTimeSync } from '../hooks/useSocket.js';
import { useConnectionActions, useRealTimeActions, useUIActions } from '../store/appStore.js';
import { useInvalidateQueries } from '../hooks/useApiQueries.js';

/**
 * IntegrationManager - Central component that manages all integrations
 * - WebSocket connection management
 * - Real-time data synchronization
 * - Store updates from socket events
 * - Error handling and notifications
 */
function IntegrationManager({ children }) {
  const socket = useSocket();
  const connection = useSocketConnection();
  const { setConnectionStatus, setOnlineStatus, updateLastPing } = useConnectionActions();
  const { updateAgentData, updateMissionData, updateSystemStatus } = useRealTimeActions();
  const { addNotification, setError, clearError } = useUIActions();
  const { invalidateAll } = useInvalidateQueries();

  // Enable real-time synchronization
  useRealTimeSync();

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setOnlineStatus(true);
      socket.getStatus().connected || socket.connect?.();
    };

    const handleOffline = () => {
      setOnlineStatus(false);
      addNotification({
        type: 'warning',
        message: 'You are currently offline. Some features may not work.',
        persistent: true,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnlineStatus, socket, addNotification]);

  // Update store with connection status changes
  useEffect(() => {
    setConnectionStatus(connection);

    // Handle connection state notifications
    switch (connection.status) {
      case 'connected':
        clearError();
        addNotification({
          type: 'success',
          message: 'Real-time connection established',
          duration: 3000,
        });
        break;
      
      case 'reconnected':
        clearError();
        addNotification({
          type: 'success',
          message: `Reconnected after ${connection.attempts} attempts`,
          duration: 5000,
        });
        // Refresh all data after reconnection
        invalidateAll();
        break;
      
      case 'disconnected':
        addNotification({
          type: 'warning',
          message: 'Real-time connection lost. Attempting to reconnect...',
          persistent: true,
        });
        break;
      
      case 'error':
        setError(`Connection error: ${connection.error}`);
        break;
      
      case 'reconnect_failed':
        setError('Failed to establish real-time connection. Please refresh the page.');
        addNotification({
          type: 'error',
          message: 'Real-time features are unavailable. Please refresh the page.',
          persistent: true,
        });
        break;
    }
  }, [connection, setConnectionStatus, addNotification, clearError, setError, invalidateAll]);

  // Handle agent status updates
  useSocketEvent('agentStatusUpdate', (data) => {
    updateAgentData(data.agentId, {
      status: data.status,
      lastSeen: new Date().toISOString(),
    });
    
    addNotification({
      type: 'info',
      message: `Agent ${data.agentId} status changed to ${data.status}`,
      duration: 4000,
    });
  });

  // Handle mission updates
  useSocketEvent('missionUpdate', (data) => {
    updateMissionData(data.missionId, {
      status: data.status,
      progress: data.progress,
      lastUpdate: new Date().toISOString(),
    });

    let message = `Mission ${data.missionId} status: ${data.status}`;
    if (data.progress !== undefined) {
      message += ` (${data.progress}%)`;
    }

    addNotification({
      type: data.status === 'COMPLETED' ? 'success' : 'info',
      message,
      duration: data.status === 'COMPLETED' ? 8000 : 4000,
    });
  });

  // Handle system notifications directly
  useSystemNotifications((notification) => {
    addNotification({
      type: notification.type || 'info',
      message: notification.message,
      duration: notification.type === 'error' ? 10000 : 5000,
    });
  });

  // Periodic ping to maintain connection
  useEffect(() => {
    const pingInterval = setInterval(() => {
      if (connection.status === 'connected') {
        socket.ping((response) => {
          updateLastPing();
          if (response !== 'pong') {
            console.warn('Unexpected ping response:', response);
          }
        });
      }
    }, 30000); // Ping every 30 seconds

    return () => clearInterval(pingInterval);
  }, [connection.status, socket, updateLastPing]);

  // Monitor page visibility to handle reconnection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !connection.status.includes('connect')) {
        // Refresh data when page becomes visible and not connected
        setTimeout(() => {
          invalidateAll();
        }, 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [connection.status, invalidateAll]);

  return children;
}

export default IntegrationManager;