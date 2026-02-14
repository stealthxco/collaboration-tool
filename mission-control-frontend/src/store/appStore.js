import { create } from 'zustand';
import { subscribeWithSelector, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Main application store
const useAppStore = create()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // Connection state
        connection: {
          isOnline: navigator.onLine,
          socketConnected: false,
          socketId: null,
          lastPing: null,
          reconnectAttempts: 0,
        },

        // UI state
        ui: {
          sidebarOpen: true,
          theme: 'light',
          loading: false,
          error: null,
          notifications: [],
          activeModal: null,
        },

        // Real-time data cache
        realTimeData: {
          agents: new Map(),
          missions: new Map(),
          systemStatus: null,
          lastUpdate: null,
        },

        // Filters and preferences
        filters: {
          agents: {
            status: null,
            search: '',
          },
          missions: {
            status: null,
            priority: null,
            agentId: null,
            search: '',
          },
        },

        // Actions for connection management
        setConnectionStatus: (status) =>
          set((state) => {
            state.connection.socketConnected = status.connected;
            state.connection.socketId = status.socketId;
            state.connection.reconnectAttempts = status.attempts || 0;
          }),

        setOnlineStatus: (isOnline) =>
          set((state) => {
            state.connection.isOnline = isOnline;
          }),

        updateLastPing: () =>
          set((state) => {
            state.connection.lastPing = new Date().toISOString();
          }),

        // Actions for UI state
        toggleSidebar: () =>
          set((state) => {
            state.ui.sidebarOpen = !state.ui.sidebarOpen;
          }),

        setTheme: (theme) =>
          set((state) => {
            state.ui.theme = theme;
            localStorage.setItem('mission-control-theme', theme);
          }),

        setLoading: (loading) =>
          set((state) => {
            state.ui.loading = loading;
          }),

        setError: (error) =>
          set((state) => {
            state.ui.error = error;
          }),

        clearError: () =>
          set((state) => {
            state.ui.error = null;
          }),

        showModal: (modalType, props = {}) =>
          set((state) => {
            state.ui.activeModal = { type: modalType, props };
          }),

        hideModal: () =>
          set((state) => {
            state.ui.activeModal = null;
          }),

        // Actions for notifications
        addNotification: (notification) =>
          set((state) => {
            const newNotification = {
              id: `${Date.now()}-${Math.random()}`,
              timestamp: new Date().toISOString(),
              read: false,
              ...notification,
            };
            state.ui.notifications.unshift(newNotification);
            
            // Keep only last 50 notifications
            if (state.ui.notifications.length > 50) {
              state.ui.notifications = state.ui.notifications.slice(0, 50);
            }
          }),

        markNotificationRead: (id) =>
          set((state) => {
            const notification = state.ui.notifications.find(n => n.id === id);
            if (notification) {
              notification.read = true;
            }
          }),

        clearNotifications: () =>
          set((state) => {
            state.ui.notifications = [];
          }),

        clearReadNotifications: () =>
          set((state) => {
            state.ui.notifications = state.ui.notifications.filter(n => !n.read);
          }),

        // Actions for real-time data
        updateAgentData: (agentId, data) =>
          set((state) => {
            state.realTimeData.agents.set(agentId, {
              ...state.realTimeData.agents.get(agentId),
              ...data,
              lastUpdate: new Date().toISOString(),
            });
            state.realTimeData.lastUpdate = new Date().toISOString();
          }),

        updateMissionData: (missionId, data) =>
          set((state) => {
            state.realTimeData.missions.set(missionId, {
              ...state.realTimeData.missions.get(missionId),
              ...data,
              lastUpdate: new Date().toISOString(),
            });
            state.realTimeData.lastUpdate = new Date().toISOString();
          }),

        updateSystemStatus: (status) =>
          set((state) => {
            state.realTimeData.systemStatus = {
              ...status,
              lastUpdate: new Date().toISOString(),
            };
            state.realTimeData.lastUpdate = new Date().toISOString();
          }),

        // Actions for filters
        setAgentFilters: (filters) =>
          set((state) => {
            state.filters.agents = { ...state.filters.agents, ...filters };
          }),

        setMissionFilters: (filters) =>
          set((state) => {
            state.filters.missions = { ...state.filters.missions, ...filters };
          }),

        clearAllFilters: () =>
          set((state) => {
            state.filters.agents = { status: null, search: '' };
            state.filters.missions = { status: null, priority: null, agentId: null, search: '' };
          }),

        // Computed getters
        getUnreadNotificationCount: () => {
          const { notifications } = get().ui;
          return notifications.filter(n => !n.read).length;
        },

        getAgentRealTimeData: (agentId) => {
          const { agents } = get().realTimeData;
          return agents.get(agentId);
        },

        getMissionRealTimeData: (missionId) => {
          const { missions } = get().realTimeData;
          return missions.get(missionId);
        },

        // Bulk operations
        resetStore: () =>
          set((state) => {
            state.connection = {
              isOnline: navigator.onLine,
              socketConnected: false,
              socketId: null,
              lastPing: null,
              reconnectAttempts: 0,
            };
            state.ui.loading = false;
            state.ui.error = null;
            state.ui.notifications = [];
            state.ui.activeModal = null;
            state.realTimeData.agents.clear();
            state.realTimeData.missions.clear();
            state.realTimeData.systemStatus = null;
            state.realTimeData.lastUpdate = null;
          }),
      }))
    ),
    {
      name: 'mission-control-store',
      partialize: (state) => ({
        ui: {
          sidebarOpen: state.ui.sidebarOpen,
          theme: state.ui.theme,
        },
        filters: state.filters,
      }),
    }
  )
);

// Derived selectors
export const useConnectionState = () => useAppStore(state => state.connection);
export const useUIState = () => useAppStore(state => state.ui);
export const useRealTimeData = () => useAppStore(state => state.realTimeData);
export const useFilters = () => useAppStore(state => state.filters);
export const useNotifications = () => useAppStore(state => ({
  notifications: state.ui.notifications,
  unreadCount: state.getUnreadNotificationCount(),
  addNotification: state.addNotification,
  markNotificationRead: state.markNotificationRead,
  clearNotifications: state.clearNotifications,
  clearReadNotifications: state.clearReadNotifications,
}));

// Connection-specific selectors and actions
export const useConnectionActions = () => useAppStore(state => ({
  setConnectionStatus: state.setConnectionStatus,
  setOnlineStatus: state.setOnlineStatus,
  updateLastPing: state.updateLastPing,
}));

// UI-specific selectors and actions
export const useUIActions = () => useAppStore(state => ({
  toggleSidebar: state.toggleSidebar,
  setTheme: state.setTheme,
  setLoading: state.setLoading,
  setError: state.setError,
  clearError: state.clearError,
  showModal: state.showModal,
  hideModal: state.hideModal,
}));

// Real-time data selectors and actions
export const useRealTimeActions = () => useAppStore(state => ({
  updateAgentData: state.updateAgentData,
  updateMissionData: state.updateMissionData,
  updateSystemStatus: state.updateSystemStatus,
  getAgentRealTimeData: state.getAgentRealTimeData,
  getMissionRealTimeData: state.getMissionRealTimeData,
}));

// Filter selectors and actions
export const useFilterActions = () => useAppStore(state => ({
  setAgentFilters: state.setAgentFilters,
  setMissionFilters: state.setMissionFilters,
  clearAllFilters: state.clearAllFilters,
}));

export default useAppStore;