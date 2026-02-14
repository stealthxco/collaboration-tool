import { io } from 'socket.io-client';
import { API_CONFIG } from '../config/api.js';

class SocketClient {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.eventHandlers = new Map();
  }

  connect() {
    if (this.socket?.connected) {
      console.log('🔌 Socket already connected');
      return this.socket;
    }

    console.log('🔌 Connecting to WebSocket server...');

    this.socket = io(API_CONFIG.SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      timeout: 10000,
    });

    this.setupEventHandlers();
    return this.socket;
  }

  setupEventHandlers() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connection', { status: 'connected', socketId: this.socket.id });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      this.isConnected = false;
      this.emit('connection', { status: 'disconnected', reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error);
      this.reconnectAttempts++;
      this.emit('connection', { 
        status: 'error', 
        error: error.message,
        attempts: this.reconnectAttempts 
      });
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 WebSocket reconnected after ${attemptNumber} attempts`);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connection', { status: 'reconnected', attempts: attemptNumber });
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 WebSocket reconnection attempt ${attemptNumber}`);
      this.emit('connection', { status: 'reconnecting', attempts: attemptNumber });
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ WebSocket reconnection failed after maximum attempts');
      this.emit('connection', { status: 'reconnect_failed' });
    });

    // Business logic events
    this.socket.on('agentStatusUpdate', (data) => {
      console.log('📡 Agent status update:', data);
      this.emit('agentStatusUpdate', data);
    });

    this.socket.on('missionUpdate', (data) => {
      console.log('📡 Mission update:', data);
      this.emit('missionUpdate', data);
    });

    this.socket.on('newComment', (data) => {
      console.log('📡 New comment:', data);
      this.emit('newComment', data);
    });

    this.socket.on('systemNotification', (data) => {
      console.log('📡 System notification:', data);
      this.emit('systemNotification', data);
    });
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting WebSocket...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Event handler management
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event).add(handler);

    // Return cleanup function
    return () => {
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.eventHandlers.delete(event);
        }
      }
    };
  }

  off(event, handler) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.eventHandlers.delete(event);
      }
    }
  }

  emit(event, data) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  // Room management
  joinRoom(room) {
    if (this.socket?.connected) {
      console.log(`📡 Joining room: ${room}`);
      this.socket.emit('joinRoom', room);
    }
  }

  leaveRoom(room) {
    if (this.socket?.connected) {
      console.log(`📡 Leaving room: ${room}`);
      this.socket.emit('leaveRoom', room);
    }
  }

  // Utility methods
  ping(callback) {
    if (this.socket?.connected) {
      this.socket.emit('ping', (response) => {
        console.log('🏓 Socket ping response:', response);
        if (callback) callback(response);
      });
    }
  }

  getStatus() {
    return {
      connected: this.isConnected,
      socketId: this.socket?.id || null,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  // Auto-reconnect with exponential backoff
  async forceReconnect() {
    if (this.socket) {
      this.disconnect();
    }

    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts), 30000);
    console.log(`🔄 Force reconnecting in ${delay}ms...`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    this.connect();
  }
}

// Create singleton instance
const socketClient = new SocketClient();

// Export instance and class for testing
export { SocketClient };
export default socketClient;