import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import websocketService from '../services/websocket';

const useCollaborationStore = create(
  subscribeWithSelector((set, get) => ({
    // Connection state
    isConnected: false,
    connectionError: null,
    reconnectAttempts: 0,

    // Current user and session
    currentUser: null,
    currentBoard: null,
    sessionId: null,

    // User presence
    connectedUsers: new Map(),
    userCursors: new Map(),
    userPresence: new Map(),
    
    // Typing indicators
    typingUsers: new Map(),
    
    // Card locks and editing
    cardLocks: new Map(),
    cardVersions: new Map(),
    lockedCards: new Set(),
    
    // Comments
    commentVersions: new Map(),
    liveComments: new Map(),
    
    // Conflicts
    activeConflicts: new Map(),
    
    // Notifications
    notifications: [],
    unreadCount: 0,

    // ===== ACTIONS =====

    // Connection management
    setConnectionState: (connected, error = null) => set({
      isConnected: connected,
      connectionError: error,
      reconnectAttempts: connected ? 0 : get().reconnectAttempts + 1
    }),

    // User management
    setCurrentUser: (user) => set({ currentUser: user }),
    
    setCurrentBoard: (boardId) => set({ currentBoard: boardId }),

    // User presence
    addUser: (user) => set((state) => {
      const newUsers = new Map(state.connectedUsers);
      newUsers.set(user.userId, {
        ...user,
        joinedAt: new Date().toISOString()
      });
      return { connectedUsers: newUsers };
    }),

    removeUser: (userId) => set((state) => {
      const newUsers = new Map(state.connectedUsers);
      newUsers.delete(userId);
      
      // Also remove from other maps
      const newCursors = new Map(state.userCursors);
      newCursors.delete(userId);
      
      const newPresence = new Map(state.userPresence);
      newPresence.delete(userId);
      
      const newTyping = new Map(state.typingUsers);
      newTyping.delete(userId);

      return {
        connectedUsers: newUsers,
        userCursors: newCursors,
        userPresence: newPresence,
        typingUsers: newTyping
      };
    }),

    updateUserPresence: (userId, presenceData) => set((state) => {
      const newPresence = new Map(state.userPresence);
      newPresence.set(userId, {
        ...presenceData,
        timestamp: new Date().toISOString()
      });
      return { userPresence: newPresence };
    }),

    // Cursor tracking
    updateUserCursor: (userId, cursorData) => set((state) => {
      const newCursors = new Map(state.userCursors);
      newCursors.set(userId, {
        ...cursorData,
        timestamp: new Date().toISOString()
      });
      return { userCursors: newCursors };
    }),

    clearUserCursor: (userId) => set((state) => {
      const newCursors = new Map(state.userCursors);
      newCursors.delete(userId);
      return { userCursors: newCursors };
    }),

    // Typing indicators
    setUserTyping: (userId, typingData) => set((state) => {
      const newTyping = new Map(state.typingUsers);
      if (typingData.isTyping) {
        newTyping.set(userId, {
          ...typingData,
          timestamp: new Date().toISOString()
        });
      } else {
        newTyping.delete(userId);
      }
      return { typingUsers: newTyping };
    }),

    // Card locking
    setCardLock: (cardId, lockData) => set((state) => {
      const newLocks = new Map(state.cardLocks);
      newLocks.set(cardId, lockData);
      
      const newLockedCards = new Set(state.lockedCards);
      newLockedCards.add(cardId);
      
      return { cardLocks: newLocks, lockedCards: newLockedCards };
    }),

    releaseCardLock: (cardId) => set((state) => {
      const newLocks = new Map(state.cardLocks);
      newLocks.delete(cardId);
      
      const newLockedCards = new Set(state.lockedCards);
      newLockedCards.delete(cardId);
      
      return { cardLocks: newLocks, lockedCards: newLockedCards };
    }),

    // Card editing and versions
    updateCardVersion: (cardId, version) => set((state) => {
      const newVersions = new Map(state.cardVersions);
      newVersions.set(cardId, version);
      return { cardVersions: newVersions };
    }),

    applyCardEdit: (cardEdit) => set((state) => {
      // Update version
      const newVersions = new Map(state.cardVersions);
      newVersions.set(cardEdit.cardId, cardEdit.version);
      
      return {
        cardVersions: newVersions,
        lastCardEdit: {
          ...cardEdit,
          appliedAt: new Date().toISOString()
        }
      };
    }),

    // Comment versions
    updateCommentVersion: (commentId, version) => set((state) => {
      const newVersions = new Map(state.commentVersions);
      newVersions.set(commentId, version);
      return { commentVersions: newVersions };
    }),

    updateLiveComment: (commentData) => set((state) => {
      const newComments = new Map(state.liveComments);
      newComments.set(commentData.commentId, commentData);
      return { liveComments: newComments };
    }),

    deleteLiveComment: (commentId) => set((state) => {
      const newComments = new Map(state.liveComments);
      newComments.delete(commentId);
      return { liveComments: newComments };
    }),

    // Conflict management
    addConflict: (entityType, entityId, conflictData) => set((state) => {
      const newConflicts = new Map(state.activeConflicts);
      newConflicts.set(`${entityType}:${entityId}`, {
        entityType,
        entityId,
        ...conflictData,
        detectedAt: new Date().toISOString()
      });
      return { activeConflicts: newConflicts };
    }),

    resolveConflict: (entityType, entityId) => set((state) => {
      const newConflicts = new Map(state.activeConflicts);
      newConflicts.delete(`${entityType}:${entityId}`);
      return { activeConflicts: newConflicts };
    }),

    // Notifications
    addNotification: (notification) => set((state) => ({
      notifications: [
        {
          ...notification,
          id: notification.id || `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          receivedAt: new Date().toISOString(),
          read: false
        },
        ...state.notifications
      ].slice(0, 100), // Keep only last 100 notifications
      unreadCount: state.unreadCount + 1
    })),

    markNotificationRead: (notificationId) => set((state) => ({
      notifications: state.notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1)
    })),

    clearNotifications: () => set({
      notifications: [],
      unreadCount: 0
    }),

    // ===== WEBSOCKET INTEGRATION =====

    initializeWebSocket: () => {
      const state = get();
      
      // Connection events
      websocketService.on('connection', (data) => {
        state.setConnectionState(data.connected, null);
      });

      websocketService.on('connection_error', (data) => {
        state.setConnectionState(false, data.error);
      });

      // User events
      websocketService.on('userJoined', (data) => {
        state.addUser(data);
      });

      websocketService.on('userLeft', (data) => {
        state.removeUser(data.userId);
      });

      websocketService.on('userPresence', (data) => {
        state.updateUserPresence(data.userId, data);
      });

      websocketService.on('userCursor', (data) => {
        state.updateUserCursor(data.userId, data);
      });

      // Typing events
      websocketService.on('userTyping', (data) => {
        state.setUserTyping(data.userId, data);
      });

      // Card events
      websocketService.on('cardLock', (data) => {
        state.setCardLock(data.cardId, data);
      });

      websocketService.on('cardUnlock', (data) => {
        state.releaseCardLock(data.cardId);
      });

      websocketService.on('cardEdit', (data) => {
        state.applyCardEdit(data);
      });

      // Comment events
      websocketService.on('liveCommentUpdate', (data) => {
        state.updateLiveComment(data);
      });

      websocketService.on('commentDeleted', (data) => {
        state.deleteLiveComment(data.commentId);
      });

      // Conflict events
      websocketService.on('conflictDetected', (data) => {
        state.addConflict(data.entityType, data.entityId, data);
      });

      websocketService.on('conflictResolved', (data) => {
        state.resolveConflict(data.entityType, data.entityId);
      });

      // Notification events
      websocketService.on('pushNotification', (data) => {
        state.addNotification(data);
        
        // Show browser notification if supported
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(data.title, {
            body: data.message,
            icon: '/favicon.ico',
            tag: data.id
          });
        }
      });
    },

    // ===== HELPER FUNCTIONS =====

    // Get user info
    getUser: (userId) => {
      const state = get();
      return state.connectedUsers.get(userId);
    },

    // Get card lock info
    getCardLock: (cardId) => {
      const state = get();
      return state.cardLocks.get(cardId);
    },

    // Check if card is locked by current user
    isCardLockedByMe: (cardId) => {
      const state = get();
      const lock = state.cardLocks.get(cardId);
      return lock && lock.userId === state.currentUser?.userId;
    },

    // Check if card is locked by someone else
    isCardLockedByOther: (cardId) => {
      const state = get();
      const lock = state.cardLocks.get(cardId);
      return lock && lock.userId !== state.currentUser?.userId;
    },

    // Get typing users for a specific entity
    getTypingUsers: (cardId = null, commentId = null) => {
      const state = get();
      const typingUsers = [];
      
      for (const [userId, typingData] of state.typingUsers) {
        if ((cardId && typingData.cardId === cardId) || 
            (commentId && typingData.commentId === commentId)) {
          const user = state.connectedUsers.get(userId);
          if (user) {
            typingUsers.push(user);
          }
        }
      }
      
      return typingUsers;
    },

    // Get active conflicts count
    getActiveConflictsCount: () => {
      const state = get();
      return state.activeConflicts.size;
    },

    // Reset all state
    reset: () => set({
      isConnected: false,
      connectionError: null,
      reconnectAttempts: 0,
      currentUser: null,
      currentBoard: null,
      sessionId: null,
      connectedUsers: new Map(),
      userCursors: new Map(),
      userPresence: new Map(),
      typingUsers: new Map(),
      cardLocks: new Map(),
      cardVersions: new Map(),
      lockedCards: new Set(),
      commentVersions: new Map(),
      liveComments: new Map(),
      activeConflicts: new Map(),
      notifications: [],
      unreadCount: 0
    })
  }))
);

export default useCollaborationStore;