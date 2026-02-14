import { FastifyInstance } from 'fastify';
import { Server as SocketIOServer } from 'socket.io';
import { WebSocketMessage } from '../types';

export interface ServerToClientEvents {
  // Existing events
  agentStatusUpdate: (data: { agentId: string; status: string }) => void;
  missionUpdate: (data: { missionId: string; status: string; progress?: number }) => void;
  newComment: (data: { commentId: string; agentId?: string; missionId?: string }) => void;
  systemNotification: (data: { type: string; message: string; timestamp: string }) => void;
  
  // Real-time collaboration events
  userJoined: (data: { userId: string; username: string; avatar?: string; boardId?: string }) => void;
  userLeft: (data: { userId: string; boardId?: string }) => void;
  userPresence: (data: { userId: string; status: 'online' | 'away' | 'offline'; lastSeen?: string }) => void;
  userCursor: (data: { userId: string; username: string; x: number; y: number; boardId?: string; elementId?: string }) => void;
  
  // Live editing events
  cardEdit: (data: { cardId: string; userId: string; field: string; value: any; version: number; timestamp: string }) => void;
  cardLock: (data: { cardId: string; userId: string; username: string; timestamp: string }) => void;
  cardUnlock: (data: { cardId: string; userId: string }) => void;
  cardMove: (data: { cardId: string; fromColumnId: string; toColumnId: string; position: number; userId: string; timestamp: string }) => void;
  
  // Typing indicators
  userTyping: (data: { userId: string; username: string; cardId?: string; commentId?: string; isTyping: boolean }) => void;
  
  // Live updates
  liveCommentUpdate: (data: { commentId: string; content: string; userId: string; timestamp: string }) => void;
  commentDeleted: (data: { commentId: string; userId: string; timestamp: string }) => void;
  
  // Conflict resolution
  conflictDetected: (data: { entityType: 'card' | 'comment'; entityId: string; conflictingVersions: any[]; timestamp: string }) => void;
  conflictResolved: (data: { entityType: 'card' | 'comment'; entityId: string; resolvedVersion: any; resolvedBy: string; timestamp: string }) => void;
  
  // Push notifications
  pushNotification: (data: { 
    id: string; 
    title: string; 
    message: string; 
    type: 'info' | 'success' | 'warning' | 'error'; 
    userId?: string; 
    actionUrl?: string;
    timestamp: string;
  }) => void;
}

export interface ClientToServerEvents {
  // Room management
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;
  joinBoard: (boardId: string, userInfo: { userId: string; username: string; avatar?: string }) => void;
  leaveBoard: (boardId: string) => void;
  ping: (callback: (data: string) => void) => void;
  
  // User presence
  updatePresence: (status: 'online' | 'away' | 'offline') => void;
  sendCursorPosition: (data: { x: number; y: number; boardId?: string; elementId?: string }) => void;
  
  // Live editing
  requestCardLock: (cardId: string, callback: (success: boolean, currentLock?: any) => void) => void;
  releaseCardLock: (cardId: string) => void;
  updateCard: (data: { cardId: string; field: string; value: any; version: number }) => void;
  moveCard: (data: { cardId: string; fromColumnId: string; toColumnId: string; position: number }) => void;
  
  // Typing indicators
  startTyping: (data: { cardId?: string; commentId?: string }) => void;
  stopTyping: (data: { cardId?: string; commentId?: string }) => void;
  
  // Comments
  updateComment: (data: { commentId: string; content: string; version: number }) => void;
  deleteComment: (commentId: string) => void;
  
  // Conflict resolution
  submitConflictResolution: (data: { entityType: 'card' | 'comment'; entityId: string; resolvedVersion: any }) => void;
}

export interface InterServerEvents {
  // Events between server instances (for scaling)
}

export interface SocketData {
  userId: string;
  username: string;
  avatar?: string;
  rooms: string[];
  boards: string[];
  presence: 'online' | 'away' | 'offline';
  lastSeen: string;
  currentCursor?: { x: number; y: number; boardId?: string; elementId?: string };
  typingIn?: { cardId?: string; commentId?: string };
  lockedCards: string[];
}

class WebSocketService {
  private static instance: WebSocketService;
  private io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> | null = null;

  private constructor() {}

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  initialize(fastify: FastifyInstance): void {
    this.io = new SocketIOServer(fastify.server, {
      cors: {
        origin: process.env.NODE_ENV === 'development' ? '*' : false,
        methods: ['GET', 'POST'],
      },
      transports: ['websocket', 'polling'],
    });

    this.setupEventHandlers();
    console.log('✅ WebSocket server initialized');
  }

  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      console.log(`🔌 Client connected: ${socket.id}`);

      // Initialize socket data
      socket.data = {
        userId: '',
        username: '',
        rooms: [],
        boards: [],
        presence: 'online',
        lastSeen: new Date().toISOString(),
        lockedCards: []
      };

      // ===== ROOM & BOARD MANAGEMENT =====
      socket.on('joinRoom', (room: string) => {
        socket.join(room);
        socket.data.rooms.push(room);
        console.log(`📡 Client ${socket.id} joined room: ${room}`);
      });

      socket.on('leaveRoom', (room: string) => {
        socket.leave(room);
        socket.data.rooms = socket.data.rooms.filter(r => r !== room);
        console.log(`📡 Client ${socket.id} left room: ${room}`);
      });

      socket.on('joinBoard', (boardId: string, userInfo: { userId: string; username: string; avatar?: string }) => {
        // Update socket data with user info
        socket.data.userId = userInfo.userId;
        socket.data.username = userInfo.username;
        socket.data.avatar = userInfo.avatar;
        
        const boardRoom = `board:${boardId}`;
        socket.join(boardRoom);
        socket.data.boards.push(boardId);
        
        // Notify others that user joined
        socket.to(boardRoom).emit('userJoined', {
          userId: userInfo.userId,
          username: userInfo.username,
          avatar: userInfo.avatar,
          boardId
        });

        // Send current board users to new joiner
        this.sendBoardUserList(boardId, socket);
        
        console.log(`👤 User ${userInfo.username} (${userInfo.userId}) joined board: ${boardId}`);
      });

      socket.on('leaveBoard', (boardId: string) => {
        const boardRoom = `board:${boardId}`;
        socket.leave(boardRoom);
        socket.data.boards = socket.data.boards.filter(b => b !== boardId);
        
        // Notify others that user left
        socket.to(boardRoom).emit('userLeft', {
          userId: socket.data.userId,
          boardId
        });

        // Release any locks held by this user
        this.releaseAllCardLocks(socket.data.userId, boardId);
        
        console.log(`👤 User ${socket.data.username} left board: ${boardId}`);
      });

      // ===== USER PRESENCE =====
      socket.on('updatePresence', (status: 'online' | 'away' | 'offline') => {
        socket.data.presence = status;
        socket.data.lastSeen = new Date().toISOString();
        
        // Broadcast presence to all boards user is in
        socket.data.boards.forEach(boardId => {
          socket.to(`board:${boardId}`).emit('userPresence', {
            userId: socket.data.userId,
            status,
            lastSeen: socket.data.lastSeen
          });
        });
      });

      socket.on('sendCursorPosition', (data: { x: number; y: number; boardId?: string; elementId?: string }) => {
        socket.data.currentCursor = data;
        
        const targetRoom = data.boardId ? `board:${data.boardId}` : undefined;
        if (targetRoom) {
          socket.to(targetRoom).emit('userCursor', {
            userId: socket.data.userId,
            username: socket.data.username,
            x: data.x,
            y: data.y,
            boardId: data.boardId,
            elementId: data.elementId
          });
        }
      });

      // ===== LIVE EDITING =====
      socket.on('requestCardLock', async (cardId: string, callback) => {
        const existingLock = await this.getCardLock(cardId);
        
        if (existingLock && existingLock.userId !== socket.data.userId) {
          callback(false, existingLock);
          return;
        }

        // Grant lock
        const lock = {
          cardId,
          userId: socket.data.userId,
          username: socket.data.username,
          timestamp: new Date().toISOString(),
          socketId: socket.id
        };

        await this.setCardLock(cardId, lock);
        socket.data.lockedCards.push(cardId);

        // Notify others about the lock
        socket.data.boards.forEach(boardId => {
          socket.to(`board:${boardId}`).emit('cardLock', lock);
        });

        callback(true);
        console.log(`🔒 Card ${cardId} locked by ${socket.data.username}`);
      });

      socket.on('releaseCardLock', async (cardId: string) => {
        await this.releaseCardLock(cardId, socket.data.userId);
        socket.data.lockedCards = socket.data.lockedCards.filter(id => id !== cardId);

        // Notify others about unlock
        socket.data.boards.forEach(boardId => {
          socket.to(`board:${boardId}`).emit('cardUnlock', {
            cardId,
            userId: socket.data.userId
          });
        });

        console.log(`🔓 Card ${cardId} unlocked by ${socket.data.username}`);
      });

      socket.on('updateCard', async (data: { cardId: string; field: string; value: any; version: number }) => {
        // Check if user has lock
        const lock = await this.getCardLock(data.cardId);
        if (!lock || lock.userId !== socket.data.userId) {
          return; // User doesn't have lock
        }

        // Check for version conflicts
        const currentVersion = await this.getCardVersion(data.cardId);
        if (currentVersion && currentVersion > data.version) {
          // Conflict detected
          this.broadcastConflictDetected('card', data.cardId, socket.data.userId);
          return;
        }

        // Update card version
        await this.updateCardVersion(data.cardId, data.version + 1);

        // Broadcast update
        const updateData = {
          ...data,
          userId: socket.data.userId,
          version: data.version + 1,
          timestamp: new Date().toISOString()
        };

        socket.data.boards.forEach(boardId => {
          socket.to(`board:${boardId}`).emit('cardEdit', updateData);
        });

        console.log(`📝 Card ${data.cardId} updated by ${socket.data.username}`);
      });

      socket.on('moveCard', (data: { cardId: string; fromColumnId: string; toColumnId: string; position: number }) => {
        const moveData = {
          ...data,
          userId: socket.data.userId,
          timestamp: new Date().toISOString()
        };

        socket.data.boards.forEach(boardId => {
          socket.to(`board:${boardId}`).emit('cardMove', moveData);
        });

        console.log(`🔄 Card ${data.cardId} moved by ${socket.data.username}`);
      });

      // ===== TYPING INDICATORS =====
      socket.on('startTyping', (data: { cardId?: string; commentId?: string }) => {
        socket.data.typingIn = data;

        socket.data.boards.forEach(boardId => {
          socket.to(`board:${boardId}`).emit('userTyping', {
            userId: socket.data.userId,
            username: socket.data.username,
            cardId: data.cardId,
            commentId: data.commentId,
            isTyping: true
          });
        });
      });

      socket.on('stopTyping', (data: { cardId?: string; commentId?: string }) => {
        socket.data.typingIn = undefined;

        socket.data.boards.forEach(boardId => {
          socket.to(`board:${boardId}`).emit('userTyping', {
            userId: socket.data.userId,
            username: socket.data.username,
            cardId: data.cardId,
            commentId: data.commentId,
            isTyping: false
          });
        });
      });

      // ===== LIVE COMMENTS =====
      socket.on('updateComment', async (data: { commentId: string; content: string; version: number }) => {
        // Check version conflicts
        const currentVersion = await this.getCommentVersion(data.commentId);
        if (currentVersion && currentVersion > data.version) {
          this.broadcastConflictDetected('comment', data.commentId, socket.data.userId);
          return;
        }

        await this.updateCommentVersion(data.commentId, data.version + 1);

        const updateData = {
          ...data,
          userId: socket.data.userId,
          version: data.version + 1,
          timestamp: new Date().toISOString()
        };

        socket.data.boards.forEach(boardId => {
          socket.to(`board:${boardId}`).emit('liveCommentUpdate', updateData);
        });
      });

      socket.on('deleteComment', (commentId: string) => {
        socket.data.boards.forEach(boardId => {
          socket.to(`board:${boardId}`).emit('commentDeleted', {
            commentId,
            userId: socket.data.userId,
            timestamp: new Date().toISOString()
          });
        });
      });

      // ===== CONFLICT RESOLUTION =====
      socket.on('submitConflictResolution', async (data: { entityType: 'card' | 'comment'; entityId: string; resolvedVersion: any }) => {
        // Update version
        if (data.entityType === 'card') {
          await this.updateCardVersion(data.entityId, data.resolvedVersion.version);
        } else {
          await this.updateCommentVersion(data.entityId, data.resolvedVersion.version);
        }

        // Broadcast resolution
        socket.data.boards.forEach(boardId => {
          this.io?.to(`board:${boardId}`).emit('conflictResolved', {
            entityType: data.entityType,
            entityId: data.entityId,
            resolvedVersion: data.resolvedVersion,
            resolvedBy: socket.data.userId,
            timestamp: new Date().toISOString()
          });
        });
      });

      // ===== BASIC EVENTS =====
      socket.on('ping', (callback) => {
        callback('pong');
      });

      // ===== DISCONNECT HANDLING =====
      socket.on('disconnect', async (reason) => {
        console.log(`🔌 Client disconnected: ${socket.id}, reason: ${reason}`);

        // Update presence to offline
        socket.data.presence = 'offline';
        socket.data.lastSeen = new Date().toISOString();

        // Notify boards about user leaving
        socket.data.boards.forEach(boardId => {
          socket.to(`board:${boardId}`).emit('userLeft', {
            userId: socket.data.userId,
            boardId
          });
          
          socket.to(`board:${boardId}`).emit('userPresence', {
            userId: socket.data.userId,
            status: 'offline' as const,
            lastSeen: socket.data.lastSeen
          });
        });

        // Release all locks
        await this.releaseAllCardLocks(socket.data.userId);

        // Clear typing indicators
        if (socket.data.typingIn) {
          socket.data.boards.forEach(boardId => {
            socket.to(`board:${boardId}`).emit('userTyping', {
              userId: socket.data.userId,
              username: socket.data.username,
              cardId: socket.data.typingIn?.cardId,
              commentId: socket.data.typingIn?.commentId,
              isTyping: false
            });
          });
        }
      });
    });
  }

  // Broadcast methods
  broadcastAgentStatusUpdate(agentId: string, status: string): void {
    if (!this.io) return;
    this.io.emit('agentStatusUpdate', { agentId, status });
    this.io.to(`agent:${agentId}`).emit('agentStatusUpdate', { agentId, status });
  }

  broadcastMissionUpdate(missionId: string, status: string, progress?: number): void {
    if (!this.io) return;
    this.io.emit('missionUpdate', { missionId, status, progress });
    this.io.to(`mission:${missionId}`).emit('missionUpdate', { missionId, status, progress });
  }

  broadcastNewComment(commentId: string, agentId?: string, missionId?: string): void {
    if (!this.io) return;
    this.io.emit('newComment', { commentId, agentId, missionId });
    
    if (agentId) {
      this.io.to(`agent:${agentId}`).emit('newComment', { commentId, agentId, missionId });
    }
    
    if (missionId) {
      this.io.to(`mission:${missionId}`).emit('newComment', { commentId, agentId, missionId });
    }
  }

  broadcastSystemNotification(type: string, message: string): void {
    if (!this.io) return;
    this.io.emit('systemNotification', {
      type,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  // Room management
  getConnectedClients(): number {
    return this.io ? this.io.sockets.sockets.size : 0;
  }

  getRoomsForSocket(socketId: string): string[] {
    if (!this.io) return [];
    const socket = this.io.sockets.sockets.get(socketId);
    return socket?.data.rooms || [];
  }

  // ===== COLLABORATION METHODS =====
  
  // User presence and board management
  sendBoardUserList(boardId: string, socket: any): void {
    if (!this.io) return;
    
    const boardRoom = `board:${boardId}`;
    const sockets = this.io.sockets.adapter.rooms.get(boardRoom);
    
    if (sockets) {
      const users = Array.from(sockets).map(socketId => {
        const s = this.io?.sockets.sockets.get(socketId);
        if (s && s.data.userId) {
          return {
            userId: s.data.userId,
            username: s.data.username,
            avatar: s.data.avatar,
            presence: s.data.presence,
            lastSeen: s.data.lastSeen
          };
        }
        return null;
      }).filter(Boolean);

      socket.emit('boardUsers', { boardId, users });
    }
  }

  // Card locking system (using Redis for distributed locks)
  private cardLocks = new Map<string, any>();
  private cardVersions = new Map<string, number>();
  private commentVersions = new Map<string, number>();

  async getCardLock(cardId: string): Promise<any> {
    // In production, this should use Redis
    return this.cardLocks.get(cardId);
  }

  async setCardLock(cardId: string, lock: any): Promise<void> {
    this.cardLocks.set(cardId, lock);
  }

  async releaseCardLock(cardId: string, userId: string): Promise<void> {
    const lock = this.cardLocks.get(cardId);
    if (lock && lock.userId === userId) {
      this.cardLocks.delete(cardId);
    }
  }

  async releaseAllCardLocks(userId: string, boardId?: string): Promise<void> {
    for (const [cardId, lock] of this.cardLocks.entries()) {
      if (lock.userId === userId) {
        this.cardLocks.delete(cardId);
        
        // Notify about unlock
        const room = boardId ? `board:${boardId}` : undefined;
        if (room && this.io) {
          this.io.to(room).emit('cardUnlock', { cardId, userId });
        }
      }
    }
  }

  // Version management
  async getCardVersion(cardId: string): Promise<number> {
    return this.cardVersions.get(cardId) || 1;
  }

  async updateCardVersion(cardId: string, version: number): Promise<void> {
    this.cardVersions.set(cardId, version);
  }

  async getCommentVersion(commentId: string): Promise<number> {
    return this.commentVersions.get(commentId) || 1;
  }

  async updateCommentVersion(commentId: string, version: number): Promise<void> {
    this.commentVersions.set(commentId, version);
  }

  // ===== ENHANCED BROADCAST METHODS =====
  
  // Enhanced user presence broadcasting
  broadcastUserPresence(userId: string, username: string, status: 'online' | 'away' | 'offline', boardId?: string): void {
    if (!this.io) return;
    
    const data = {
      userId,
      username,
      status,
      lastSeen: new Date().toISOString()
    };

    if (boardId) {
      this.io.to(`board:${boardId}`).emit('userPresence', data);
    } else {
      this.io.emit('userPresence', data);
    }
  }

  // Live cursor broadcasting
  broadcastCursorPosition(userId: string, username: string, x: number, y: number, boardId: string, elementId?: string): void {
    if (!this.io) return;
    
    this.io.to(`board:${boardId}`).emit('userCursor', {
      userId,
      username,
      x,
      y,
      boardId,
      elementId
    });
  }

  // Typing indicator broadcasting
  broadcastTypingIndicator(userId: string, username: string, isTyping: boolean, cardId?: string, commentId?: string, boardId?: string): void {
    if (!this.io) return;
    
    const data = {
      userId,
      username,
      cardId,
      commentId,
      isTyping
    };

    if (boardId) {
      this.io.to(`board:${boardId}`).emit('userTyping', data);
    } else {
      this.io.emit('userTyping', data);
    }
  }

  // Card update broadcasting
  broadcastCardUpdate(cardId: string, userId: string, field: string, value: any, version: number, boardId?: string): void {
    if (!this.io) return;
    
    const data = {
      cardId,
      userId,
      field,
      value,
      version,
      timestamp: new Date().toISOString()
    };

    if (boardId) {
      this.io.to(`board:${boardId}`).emit('cardEdit', data);
    } else {
      this.io.emit('cardEdit', data);
    }
  }

  // Card move broadcasting
  broadcastCardMove(cardId: string, fromColumnId: string, toColumnId: string, position: number, userId: string, boardId?: string): void {
    if (!this.io) return;
    
    const data = {
      cardId,
      fromColumnId,
      toColumnId,
      position,
      userId,
      timestamp: new Date().toISOString()
    };

    if (boardId) {
      this.io.to(`board:${boardId}`).emit('cardMove', data);
    } else {
      this.io.emit('cardMove', data);
    }
  }

  // Conflict detection and resolution
  broadcastConflictDetected(entityType: 'card' | 'comment', entityId: string, userId: string): void {
    if (!this.io) return;
    
    // Get conflicting versions (simplified - should fetch from DB)
    const conflictingVersions = [
      { version: 1, lastModifiedBy: 'user1', timestamp: new Date().toISOString() },
      { version: 2, lastModifiedBy: userId, timestamp: new Date().toISOString() }
    ];

    this.io.emit('conflictDetected', {
      entityType,
      entityId,
      conflictingVersions,
      timestamp: new Date().toISOString()
    });
  }

  // Push notifications
  sendPushNotification(
    userId: string,
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    actionUrl?: string
  ): void {
    if (!this.io) return;
    
    const notification = {
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      message,
      type,
      userId,
      actionUrl,
      timestamp: new Date().toISOString()
    };

    // Send to specific user if online
    const userSockets = this.getUserSockets(userId);
    if (userSockets.length > 0) {
      userSockets.forEach(socket => {
        socket.emit('pushNotification', notification);
      });
    } else {
      // Store notification for later delivery (would use Redis/DB in production)
      this.storeNotificationForLater(userId, notification);
    }
  }

  // Broadcast push notification to all users
  broadcastPushNotification(
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    actionUrl?: string
  ): void {
    if (!this.io) return;
    
    const notification = {
      id: `broadcast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      message,
      type,
      actionUrl,
      timestamp: new Date().toISOString()
    };

    this.io.emit('pushNotification', notification);
  }

  // ===== UTILITY METHODS =====
  
  private getUserSockets(userId: string): any[] {
    if (!this.io) return [];
    
    const sockets = [];
    for (const [socketId, socket] of this.io.sockets.sockets.entries()) {
      if (socket.data.userId === userId) {
        sockets.push(socket);
      }
    }
    return sockets;
  }

  private storeNotificationForLater(userId: string, notification: any): void {
    // In production, store in Redis or database
    console.log(`📧 Storing notification for offline user ${userId}:`, notification);
  }

  // Get board statistics
  getBoardStats(boardId: string): any {
    if (!this.io) return { connectedUsers: 0, activeEditors: 0 };
    
    const boardRoom = `board:${boardId}`;
    const sockets = this.io.sockets.adapter.rooms.get(boardRoom);
    
    if (!sockets) return { connectedUsers: 0, activeEditors: 0 };
    
    let activeEditors = 0;
    const users = Array.from(sockets).map(socketId => {
      const socket = this.io?.sockets.sockets.get(socketId);
      if (socket && socket.data.userId) {
        if (socket.data.lockedCards.length > 0) {
          activeEditors++;
        }
        return {
          userId: socket.data.userId,
          username: socket.data.username,
          presence: socket.data.presence,
          lockedCards: socket.data.lockedCards.length
        };
      }
      return null;
    }).filter(Boolean);

    return {
      connectedUsers: users.length,
      activeEditors,
      users
    };
  }

  // Health check
  isHealthy(): boolean {
    return this.io !== null;
  }

  // Send message to specific user
  sendToUser(userId: string, event: string, data: any): void {
    if (!this.io) return;
    
    // Find all sockets for this user
    this.io.sockets.sockets.forEach((socket) => {
      if (socket.data.userId === userId) {
        (socket as any).emit(event, data);
      }
    });
  }

  // Broadcast to all connected clients
  broadcast(event: string, data: any): void {
    if (!this.io) return;
    (this.io as any).emit(event, data);
  }

  // Broadcast to specific board
  broadcastToBoard(boardId: string, event: string, data: any): void {
    if (!this.io) return;
    if (boardId === 'global') {
      this.broadcast(event, data);
    } else {
      (this.io.to(`board:${boardId}`) as any).emit(event, data);
    }
  }

  // Get general statistics
  getStats(): any {
    if (!this.io) return { totalConnections: 0, rooms: 0 };
    
    const sockets = this.io.sockets.sockets;
    const rooms = this.io.sockets.adapter.rooms;
    
    return {
      totalConnections: sockets.size,
      rooms: rooms.size,
      connectedUsers: Array.from(sockets.values()).filter(s => s.data.userId).length
    };
  }
}

export default WebSocketService;