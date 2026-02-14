import { Agent, Mission, Comment } from '@prisma/client';
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
export interface CreateMissionRequest {
    title: string;
    description?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    agentId?: string;
    metadata?: Record<string, any>;
}
export interface UpdateMissionRequest {
    title?: string;
    description?: string;
    status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    agentId?: string;
    progress?: number;
    metadata?: Record<string, any>;
}
export interface CreateCommentRequest {
    content: string;
    type?: 'NOTE' | 'SYSTEM' | 'ERROR' | 'WARNING' | 'SUCCESS';
    agentId?: string;
    missionId?: string;
    metadata?: Record<string, any>;
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
export interface PaginatedResponse<T = any> {
    success: boolean;
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export interface WebSocketMessage {
    type: string;
    payload: any;
    timestamp: string;
}
export type AgentWithMissions = Agent & {
    missions: Mission[];
    comments: Comment[];
};
export type MissionWithDetails = Mission & {
    agent: Agent | null;
    comments: Comment[];
};
export type CommentWithDetails = Comment & {
    agent: Agent | null;
    mission: Mission | null;
};
//# sourceMappingURL=index.d.ts.map