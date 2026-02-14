import { FastifyInstance } from 'fastify';
export interface ServerToClientEvents {
    agentStatusUpdate: (data: {
        agentId: string;
        status: string;
    }) => void;
    missionUpdate: (data: {
        missionId: string;
        status: string;
        progress?: number;
    }) => void;
    newComment: (data: {
        commentId: string;
        agentId?: string;
        missionId?: string;
    }) => void;
    systemNotification: (data: {
        type: string;
        message: string;
        timestamp: string;
    }) => void;
    userJoined: (data: {
        userId: string;
        username: string;
        avatar?: string;
        boardId?: string;
    }) => void;
    userLeft: (data: {
        userId: string;
        boardId?: string;
    }) => void;
    userPresence: (data: {
        userId: string;
        status: 'online' | 'away' | 'offline';
        lastSeen?: string;
    }) => void;
    userCursor: (data: {
        userId: string;
        username: string;
        x: number;
        y: number;
        boardId?: string;
        elementId?: string;
    }) => void;
    cardEdit: (data: {
        cardId: string;
        userId: string;
        field: string;
        value: any;
        version: number;
        timestamp: string;
    }) => void;
    cardLock: (data: {
        cardId: string;
        userId: string;
        username: string;
        timestamp: string;
    }) => void;
    cardUnlock: (data: {
        cardId: string;
        userId: string;
    }) => void;
    cardMove: (data: {
        cardId: string;
        fromColumnId: string;
        toColumnId: string;
        position: number;
        userId: string;
        timestamp: string;
    }) => void;
    userTyping: (data: {
        userId: string;
        username: string;
        cardId?: string;
        commentId?: string;
        isTyping: boolean;
    }) => void;
    liveCommentUpdate: (data: {
        commentId: string;
        content: string;
        userId: string;
        timestamp: string;
    }) => void;
    commentDeleted: (data: {
        commentId: string;
        userId: string;
        timestamp: string;
    }) => void;
    conflictDetected: (data: {
        entityType: 'card' | 'comment';
        entityId: string;
        conflictingVersions: any[];
        timestamp: string;
    }) => void;
    conflictResolved: (data: {
        entityType: 'card' | 'comment';
        entityId: string;
        resolvedVersion: any;
        resolvedBy: string;
        timestamp: string;
    }) => void;
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
    joinRoom: (room: string) => void;
    leaveRoom: (room: string) => void;
    joinBoard: (boardId: string, userInfo: {
        userId: string;
        username: string;
        avatar?: string;
    }) => void;
    leaveBoard: (boardId: string) => void;
    ping: (callback: (data: string) => void) => void;
    updatePresence: (status: 'online' | 'away' | 'offline') => void;
    sendCursorPosition: (data: {
        x: number;
        y: number;
        boardId?: string;
        elementId?: string;
    }) => void;
    requestCardLock: (cardId: string, callback: (success: boolean, currentLock?: any) => void) => void;
    releaseCardLock: (cardId: string) => void;
    updateCard: (data: {
        cardId: string;
        field: string;
        value: any;
        version: number;
    }) => void;
    moveCard: (data: {
        cardId: string;
        fromColumnId: string;
        toColumnId: string;
        position: number;
    }) => void;
    startTyping: (data: {
        cardId?: string;
        commentId?: string;
    }) => void;
    stopTyping: (data: {
        cardId?: string;
        commentId?: string;
    }) => void;
    updateComment: (data: {
        commentId: string;
        content: string;
        version: number;
    }) => void;
    deleteComment: (commentId: string) => void;
    submitConflictResolution: (data: {
        entityType: 'card' | 'comment';
        entityId: string;
        resolvedVersion: any;
    }) => void;
}
export interface InterServerEvents {
}
export interface SocketData {
    userId: string;
    username: string;
    avatar?: string;
    rooms: string[];
    boards: string[];
    presence: 'online' | 'away' | 'offline';
    lastSeen: string;
    currentCursor?: {
        x: number;
        y: number;
        boardId?: string;
        elementId?: string;
    };
    typingIn?: {
        cardId?: string;
        commentId?: string;
    };
    lockedCards: string[];
}
declare class WebSocketService {
    private static instance;
    private io;
    private constructor();
    static getInstance(): WebSocketService;
    initialize(fastify: FastifyInstance): void;
    private setupEventHandlers;
    broadcastAgentStatusUpdate(agentId: string, status: string): void;
    broadcastMissionUpdate(missionId: string, status: string, progress?: number): void;
    broadcastNewComment(commentId: string, agentId?: string, missionId?: string): void;
    broadcastSystemNotification(type: string, message: string): void;
    getConnectedClients(): number;
    getRoomsForSocket(socketId: string): string[];
    sendBoardUserList(boardId: string, socket: any): void;
    private cardLocks;
    private cardVersions;
    private commentVersions;
    getCardLock(cardId: string): Promise<any>;
    setCardLock(cardId: string, lock: any): Promise<void>;
    releaseCardLock(cardId: string, userId: string): Promise<void>;
    releaseAllCardLocks(userId: string, boardId?: string): Promise<void>;
    getCardVersion(cardId: string): Promise<number>;
    updateCardVersion(cardId: string, version: number): Promise<void>;
    getCommentVersion(commentId: string): Promise<number>;
    updateCommentVersion(commentId: string, version: number): Promise<void>;
    broadcastUserPresence(userId: string, username: string, status: 'online' | 'away' | 'offline', boardId?: string): void;
    broadcastCursorPosition(userId: string, username: string, x: number, y: number, boardId: string, elementId?: string): void;
    broadcastTypingIndicator(userId: string, username: string, isTyping: boolean, cardId?: string, commentId?: string, boardId?: string): void;
    broadcastCardUpdate(cardId: string, userId: string, field: string, value: any, version: number, boardId?: string): void;
    broadcastCardMove(cardId: string, fromColumnId: string, toColumnId: string, position: number, userId: string, boardId?: string): void;
    broadcastConflictDetected(entityType: 'card' | 'comment', entityId: string, userId: string): void;
    sendPushNotification(userId: string, title: string, message: string, type?: 'info' | 'success' | 'warning' | 'error', actionUrl?: string): void;
    broadcastPushNotification(title: string, message: string, type?: 'info' | 'success' | 'warning' | 'error', actionUrl?: string): void;
    private getUserSockets;
    private storeNotificationForLater;
    getBoardStats(boardId: string): any;
    isHealthy(): boolean;
    sendToUser(userId: string, event: string, data: any): void;
    broadcast(event: string, data: any): void;
    broadcastToBoard(boardId: string, event: string, data: any): void;
    getStats(): any;
}
export default WebSocketService;
//# sourceMappingURL=socket.d.ts.map