export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
}
export interface AuthResponse {
    user: {
        id: string;
        username: string;
        email: string;
        firstName?: string;
        lastName?: string;
        avatar?: string;
    };
    token: string;
    refreshToken: string;
}
export interface CreateCommentRequest {
    content: string;
    type?: 'NOTE' | 'SYSTEM' | 'ERROR' | 'WARNING' | 'SUCCESS';
    agentId?: string;
    userId?: string;
    missionId?: string;
    metadata?: Record<string, any>;
}
export interface UpdateCommentRequest {
    content?: string;
    type?: 'NOTE' | 'SYSTEM' | 'ERROR' | 'WARNING' | 'SUCCESS';
    metadata?: Record<string, any>;
}
export interface CommentWithDetails {
    id: string;
    content: string;
    type: 'NOTE' | 'SYSTEM' | 'ERROR' | 'WARNING' | 'SUCCESS';
    agentId: string | null;
    userId: string | null;
    missionId: string | null;
    metadata?: any;
    createdAt: Date;
    updatedAt: Date;
    agent: {
        id: string;
        name: string;
        description: string | null;
        status: 'IDLE' | 'BUSY' | 'OFFLINE' | 'ERROR';
        capabilities: string[];
        metadata?: any;
        createdAt: Date;
        updatedAt: Date;
    } | null;
    user?: {
        id: string;
        username: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
        avatar: string | null;
    } | null;
    mission: {
        id: string;
        title: string;
        status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    } | null;
}
export interface CreateMissionRequest {
    title: string;
    description?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    agentId?: string;
    userId?: string;
    assigneeId?: string;
    metadata?: Record<string, any>;
}
export interface UpdateMissionRequest {
    title?: string;
    description?: string;
    status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    agentId?: string;
    assigneeId?: string;
    progress?: number;
    metadata?: Record<string, any>;
}
export interface MissionWithDetails {
    id: string;
    title: string;
    description: string | null;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    agentId: string | null;
    userId: string | null;
    assigneeId: string | null;
    progress: number;
    metadata?: any;
    startedAt: Date | null;
    completedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    agent?: {
        id: string;
        name: string;
        description: string | null;
        status: 'IDLE' | 'BUSY' | 'OFFLINE' | 'ERROR';
    } | null;
    user?: {
        id: string;
        username: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
    } | null;
    assignee?: {
        id: string;
        username: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
    } | null;
}
export interface CreateAgentRequest {
    name: string;
    description?: string;
    capabilities?: string[];
    metadata?: Record<string, any>;
}
export interface UpdateAgentRequest {
    name?: string;
    description?: string;
    status?: 'IDLE' | 'BUSY' | 'OFFLINE' | 'ERROR';
    capabilities?: string[];
    metadata?: Record<string, any>;
}
export interface AgentWithDetails {
    id: string;
    name: string;
    description: string | null;
    status: 'IDLE' | 'BUSY' | 'OFFLINE' | 'ERROR';
    capabilities: string[];
    metadata?: any;
    createdAt: Date;
    updatedAt: Date;
    _count?: {
        missions: number;
        comments: number;
    };
}
export interface AgentWithMissions extends AgentWithDetails {
    missions: MissionWithDetails[];
}
export interface WebSocketMessage {
    type: string;
    data: any;
    timestamp: string;
    userId?: string;
    boardId?: string;
}
export interface ValidationError {
    field: string;
    message: string;
    value?: any;
}
export interface ApiError {
    message: string;
    code?: string;
    details?: ValidationError[];
    statusCode?: number;
}
//# sourceMappingURL=types.d.ts.map