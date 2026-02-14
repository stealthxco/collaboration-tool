import { Server as SocketIOServer } from 'socket.io';
class WebSocketService {
    static instance;
    io = null;
    constructor() { }
    static getInstance() {
        if (!WebSocketService.instance) {
            WebSocketService.instance = new WebSocketService();
        }
        return WebSocketService.instance;
    }
    initialize(fastify) {
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
    setupEventHandlers() {
        if (!this.io)
            return;
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
            socket.on('joinRoom', (room) => {
                socket.join(room);
                socket.data.rooms.push(room);
                console.log(`📡 Client ${socket.id} joined room: ${room}`);
            });
            socket.on('leaveRoom', (room) => {
                socket.leave(room);
                socket.data.rooms = socket.data.rooms.filter(r => r !== room);
                console.log(`📡 Client ${socket.id} left room: ${room}`);
            });
            socket.on('joinBoard', (boardId, userInfo) => {
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
            socket.on('leaveBoard', (boardId) => {
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
            socket.on('updatePresence', (status) => {
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
            socket.on('sendCursorPosition', (data) => {
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
            socket.on('requestCardLock', async (cardId, callback) => {
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
            socket.on('releaseCardLock', async (cardId) => {
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
            socket.on('updateCard', async (data) => {
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
            socket.on('moveCard', (data) => {
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
            socket.on('startTyping', (data) => {
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
            socket.on('stopTyping', (data) => {
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
            socket.on('updateComment', async (data) => {
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
            socket.on('deleteComment', (commentId) => {
                socket.data.boards.forEach(boardId => {
                    socket.to(`board:${boardId}`).emit('commentDeleted', {
                        commentId,
                        userId: socket.data.userId,
                        timestamp: new Date().toISOString()
                    });
                });
            });
            // ===== CONFLICT RESOLUTION =====
            socket.on('submitConflictResolution', async (data) => {
                // Update version
                if (data.entityType === 'card') {
                    await this.updateCardVersion(data.entityId, data.resolvedVersion.version);
                }
                else {
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
                        status: 'offline',
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
    broadcastAgentStatusUpdate(agentId, status) {
        if (!this.io)
            return;
        this.io.emit('agentStatusUpdate', { agentId, status });
        this.io.to(`agent:${agentId}`).emit('agentStatusUpdate', { agentId, status });
    }
    broadcastMissionUpdate(missionId, status, progress) {
        if (!this.io)
            return;
        this.io.emit('missionUpdate', { missionId, status, progress });
        this.io.to(`mission:${missionId}`).emit('missionUpdate', { missionId, status, progress });
    }
    broadcastNewComment(commentId, agentId, missionId) {
        if (!this.io)
            return;
        this.io.emit('newComment', { commentId, agentId, missionId });
        if (agentId) {
            this.io.to(`agent:${agentId}`).emit('newComment', { commentId, agentId, missionId });
        }
        if (missionId) {
            this.io.to(`mission:${missionId}`).emit('newComment', { commentId, agentId, missionId });
        }
    }
    broadcastSystemNotification(type, message) {
        if (!this.io)
            return;
        this.io.emit('systemNotification', {
            type,
            message,
            timestamp: new Date().toISOString(),
        });
    }
    // Room management
    getConnectedClients() {
        return this.io ? this.io.sockets.sockets.size : 0;
    }
    getRoomsForSocket(socketId) {
        if (!this.io)
            return [];
        const socket = this.io.sockets.sockets.get(socketId);
        return socket?.data.rooms || [];
    }
    // ===== COLLABORATION METHODS =====
    // User presence and board management
    sendBoardUserList(boardId, socket) {
        if (!this.io)
            return;
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
    cardLocks = new Map();
    cardVersions = new Map();
    commentVersions = new Map();
    async getCardLock(cardId) {
        // In production, this should use Redis
        return this.cardLocks.get(cardId);
    }
    async setCardLock(cardId, lock) {
        this.cardLocks.set(cardId, lock);
    }
    async releaseCardLock(cardId, userId) {
        const lock = this.cardLocks.get(cardId);
        if (lock && lock.userId === userId) {
            this.cardLocks.delete(cardId);
        }
    }
    async releaseAllCardLocks(userId, boardId) {
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
    async getCardVersion(cardId) {
        return this.cardVersions.get(cardId) || 1;
    }
    async updateCardVersion(cardId, version) {
        this.cardVersions.set(cardId, version);
    }
    async getCommentVersion(commentId) {
        return this.commentVersions.get(commentId) || 1;
    }
    async updateCommentVersion(commentId, version) {
        this.commentVersions.set(commentId, version);
    }
    // ===== ENHANCED BROADCAST METHODS =====
    // Enhanced user presence broadcasting
    broadcastUserPresence(userId, username, status, boardId) {
        if (!this.io)
            return;
        const data = {
            userId,
            username,
            status,
            lastSeen: new Date().toISOString()
        };
        if (boardId) {
            this.io.to(`board:${boardId}`).emit('userPresence', data);
        }
        else {
            this.io.emit('userPresence', data);
        }
    }
    // Live cursor broadcasting
    broadcastCursorPosition(userId, username, x, y, boardId, elementId) {
        if (!this.io)
            return;
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
    broadcastTypingIndicator(userId, username, isTyping, cardId, commentId, boardId) {
        if (!this.io)
            return;
        const data = {
            userId,
            username,
            cardId,
            commentId,
            isTyping
        };
        if (boardId) {
            this.io.to(`board:${boardId}`).emit('userTyping', data);
        }
        else {
            this.io.emit('userTyping', data);
        }
    }
    // Card update broadcasting
    broadcastCardUpdate(cardId, userId, field, value, version, boardId) {
        if (!this.io)
            return;
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
        }
        else {
            this.io.emit('cardEdit', data);
        }
    }
    // Card move broadcasting
    broadcastCardMove(cardId, fromColumnId, toColumnId, position, userId, boardId) {
        if (!this.io)
            return;
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
        }
        else {
            this.io.emit('cardMove', data);
        }
    }
    // Conflict detection and resolution
    broadcastConflictDetected(entityType, entityId, userId) {
        if (!this.io)
            return;
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
    sendPushNotification(userId, title, message, type = 'info', actionUrl) {
        if (!this.io)
            return;
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
        }
        else {
            // Store notification for later delivery (would use Redis/DB in production)
            this.storeNotificationForLater(userId, notification);
        }
    }
    // Broadcast push notification to all users
    broadcastPushNotification(title, message, type = 'info', actionUrl) {
        if (!this.io)
            return;
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
    getUserSockets(userId) {
        if (!this.io)
            return [];
        const sockets = [];
        for (const [socketId, socket] of this.io.sockets.sockets.entries()) {
            if (socket.data.userId === userId) {
                sockets.push(socket);
            }
        }
        return sockets;
    }
    storeNotificationForLater(userId, notification) {
        // In production, store in Redis or database
        console.log(`📧 Storing notification for offline user ${userId}:`, notification);
    }
    // Get board statistics
    getBoardStats(boardId) {
        if (!this.io)
            return { connectedUsers: 0, activeEditors: 0 };
        const boardRoom = `board:${boardId}`;
        const sockets = this.io.sockets.adapter.rooms.get(boardRoom);
        if (!sockets)
            return { connectedUsers: 0, activeEditors: 0 };
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
    isHealthy() {
        return this.io !== null;
    }
    // Send message to specific user
    sendToUser(userId, event, data) {
        if (!this.io)
            return;
        // Find all sockets for this user
        this.io.sockets.sockets.forEach((socket) => {
            if (socket.data.userId === userId) {
                socket.emit(event, data);
            }
        });
    }
    // Broadcast to all connected clients
    broadcast(event, data) {
        if (!this.io)
            return;
        this.io.emit(event, data);
    }
    // Broadcast to specific board
    broadcastToBoard(boardId, event, data) {
        if (!this.io)
            return;
        if (boardId === 'global') {
            this.broadcast(event, data);
        }
        else {
            this.io.to(`board:${boardId}`).emit(event, data);
        }
    }
    // Get general statistics
    getStats() {
        if (!this.io)
            return { totalConnections: 0, rooms: 0 };
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
//# sourceMappingURL=socket.js.map