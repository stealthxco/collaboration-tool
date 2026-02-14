import io from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.user = null;
    this.currentBoard = null;
  }

  connect(serverUrl = 'http://localhost:3000', user = null) {
    if (this.socket) {
      this.socket.disconnect();
    }

    this.user = user;
    
    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
    });

    this.setupEventHandlers();
    return this.socket;
  }

  setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('🔌 Connected to WebSocket server');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connection', { connected: true });
      
      // Auto-join board if one is set
      if (this.currentBoard && this.user) {
        this.joinBoard(this.currentBoard, this.user);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from WebSocket server:', reason);
      this.isConnected = false;
      this.emit('connection', { connected: false, reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('🚨 WebSocket connection error:', error);
      this.reconnectAttempts++;
      this.emit('connection_error', { error, attempts: this.reconnectAttempts });
    });

    // ===== COLLABORATION EVENTS =====
    
    // User presence events
    this.socket.on('userJoined', (data) => {
      console.log('👋 User joined:', data);
      this.emit('userJoined', data);
    });

    this.socket.on('userLeft', (data) => {
      console.log('👋 User left:', data);
      this.emit('userLeft', data);
    });

    this.socket.on('userPresence', (data) => {
      this.emit('userPresence', data);
    });

    this.socket.on('userCursor', (data) => {
      this.emit('userCursor', data);
    });

    // Live editing events
    this.socket.on('cardLock', (data) => {
      console.log('🔒 Card locked:', data);
      this.emit('cardLock', data);
    });

    this.socket.on('cardUnlock', (data) => {
      console.log('🔓 Card unlocked:', data);
      this.emit('cardUnlock', data);
    });

    this.socket.on('cardEdit', (data) => {
      console.log('📝 Card edited:', data);
      this.emit('cardEdit', data);
    });

    this.socket.on('cardMove', (data) => {
      console.log('🔄 Card moved:', data);
      this.emit('cardMove', data);
    });

    // Typing indicators
    this.socket.on('userTyping', (data) => {
      this.emit('userTyping', data);
    });

    // Live comments
    this.socket.on('liveCommentUpdate', (data) => {
      console.log('💬 Comment updated:', data);
      this.emit('liveCommentUpdate', data);
    });

    this.socket.on('commentDeleted', (data) => {
      console.log('🗑️ Comment deleted:', data);
      this.emit('commentDeleted', data);
    });

    // Conflict resolution
    this.socket.on('conflictDetected', (data) => {
      console.log('⚠️ Conflict detected:', data);
      this.emit('conflictDetected', data);
    });

    this.socket.on('conflictResolved', (data) => {
      console.log('✅ Conflict resolved:', data);
      this.emit('conflictResolved', data);
    });

    // Push notifications
    this.socket.on('pushNotification', (data) => {
      console.log('🔔 Push notification:', data);
      this.emit('pushNotification', data);
    });

    // Legacy events
    this.socket.on('agentStatusUpdate', (data) => {
      this.emit('agentStatusUpdate', data);
    });

    this.socket.on('missionUpdate', (data) => {
      this.emit('missionUpdate', data);
    });

    this.socket.on('newComment', (data) => {
      this.emit('newComment', data);
    });

    this.socket.on('systemNotification', (data) => {
      this.emit('systemNotification', data);
    });
  }

  // ===== BOARD MANAGEMENT =====
  
  joinBoard(boardId, userInfo) {
    if (!this.socket || !this.isConnected) return;
    
    this.currentBoard = boardId;
    this.socket.emit('joinBoard', boardId, userInfo);
    console.log(`📋 Joining board: ${boardId}`);
  }

  leaveBoard(boardId) {
    if (!this.socket || !this.isConnected) return;
    
    this.socket.emit('leaveBoard', boardId);
    this.currentBoard = null;
    console.log(`📋 Leaving board: ${boardId}`);
  }

  // ===== PRESENCE & CURSORS =====
  
  updatePresence(status) {
    if (!this.socket || !this.isConnected) return;
    
    this.socket.emit('updatePresence', status);
  }

  sendCursorPosition(x, y, elementId = null) {
    if (!this.socket || !this.isConnected || !this.currentBoard) return;
    
    this.socket.emit('sendCursorPosition', {
      x,
      y,
      boardId: this.currentBoard,
      elementId
    });
  }

  // ===== CARD EDITING =====
  
  requestCardLock(cardId, callback) {
    if (!this.socket || !this.isConnected) return;
    
    this.socket.emit('requestCardLock', cardId, callback);
  }

  releaseCardLock(cardId) {
    if (!this.socket || !this.isConnected) return;
    
    this.socket.emit('releaseCardLock', cardId);
  }

  updateCard(cardId, field, value, version) {
    if (!this.socket || !this.isConnected) return;
    
    this.socket.emit('updateCard', { cardId, field, value, version });
  }

  moveCard(cardId, fromColumnId, toColumnId, position) {
    if (!this.socket || !this.isConnected) return;
    
    this.socket.emit('moveCard', { cardId, fromColumnId, toColumnId, position });
  }

  // ===== TYPING INDICATORS =====
  
  startTyping(cardId = null, commentId = null) {
    if (!this.socket || !this.isConnected) return;
    
    this.socket.emit('startTyping', { cardId, commentId });
  }

  stopTyping(cardId = null, commentId = null) {
    if (!this.socket || !this.isConnected) return;
    
    this.socket.emit('stopTyping', { cardId, commentId });
  }

  // ===== COMMENTS =====
  
  updateComment(commentId, content, version) {
    if (!this.socket || !this.isConnected) return;
    
    this.socket.emit('updateComment', { commentId, content, version });
  }

  deleteComment(commentId) {
    if (!this.socket || !this.isConnected) return;
    
    this.socket.emit('deleteComment', commentId);
  }

  // ===== CONFLICT RESOLUTION =====
  
  submitConflictResolution(entityType, entityId, resolvedVersion) {
    if (!this.socket || !this.isConnected) return;
    
    this.socket.emit('submitConflictResolution', {
      entityType,
      entityId,
      resolvedVersion
    });
  }

  // ===== EVENT LISTENERS =====
  
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in event callback:', error);
        }
      });
    }
  }

  // ===== UTILITY =====
  
  ping() {
    if (!this.socket || !this.isConnected) return;
    
    this.socket.emit('ping', (response) => {
      console.log('🏓 Ping response:', response);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentBoard = null;
      this.listeners.clear();
    }
  }

  getConnectionState() {
    return {
      connected: this.isConnected,
      currentBoard: this.currentBoard,
      user: this.user,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// Singleton instance
const websocketService = new WebSocketService();

export default websocketService;