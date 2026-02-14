// Global type definitions for the Collaboration Tool

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  members: WorkspaceMember[];
  projects: Project[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceMember {
  userId: string;
  user: User;
  role: WorkspaceRole;
  joinedAt: Date;
}

export enum WorkspaceRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  workspaceId: string;
  documents: Document[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  projectId: string;
  authorId: string;
  collaborators: DocumentCollaborator[];
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentCollaborator {
  userId: string;
  user: User;
  cursor?: CursorPosition;
  lastSeen: Date;
}

export interface CursorPosition {
  line: number;
  column: number;
  selection?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
}

export interface Comment {
  id: string;
  documentId: string;
  authorId: string;
  author: User;
  content: string;
  position: {
    line: number;
    column: number;
  };
  resolved: boolean;
  replies: CommentReply[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentReply {
  id: string;
  commentId: string;
  authorId: string;
  author: User;
  content: string;
  createdAt: Date;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface WebSocketEvent<T = any> {
  type: string;
  payload: T;
  timestamp: Date;
}