import { PrismaClient, User, Role, Permission } from '@prisma/client';
export interface UserWithRoles extends User {
    userRoles: Array<{
        role: Role & {
            rolePermissions: Array<{
                permission: Permission;
            }>;
        };
    }>;
}
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
export interface RegisterData {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
}
export interface LoginData {
    username: string;
    password: string;
}
export declare class AuthService {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * Hash password using bcrypt
     */
    hashPassword(password: string): Promise<string>;
    /**
     * Verify password against hash
     */
    verifyPassword(password: string, hash: string): Promise<boolean>;
    /**
     * Generate JWT access token
     */
    generateAccessToken(userId: string, permissions?: string[]): string;
    /**
     * Generate JWT refresh token
     */
    generateRefreshToken(userId: string): string;
    /**
     * Verify JWT token
     */
    verifyToken(token: string, type?: 'access' | 'refresh'): any;
    /**
     * Get user with roles and permissions
     */
    getUserWithPermissions(userId: string): Promise<UserWithRoles | null>;
    /**
     * Extract permissions from user with roles
     */
    extractPermissions(userWithRoles: UserWithRoles): string[];
    /**
     * Register a new user
     */
    register(data: RegisterData): Promise<{
        user: User;
        tokens: AuthTokens;
    }>;
    /**
     * Login user
     */
    login(data: LoginData): Promise<{
        user: User;
        tokens: AuthTokens;
    }>;
    /**
     * Generate token pair and store refresh token
     */
    generateTokenPair(userId: string, permissions?: string[]): Promise<AuthTokens>;
    /**
     * Refresh tokens
     */
    refreshTokens(refreshToken: string): Promise<AuthTokens>;
    /**
     * Logout user (revoke refresh token)
     */
    logout(refreshToken: string): Promise<void>;
    /**
     * Logout all sessions for a user
     */
    logoutAll(userId: string): Promise<void>;
    /**
     * Check if user has specific permission
     */
    hasPermission(userId: string, resource: string, action: string): Promise<boolean>;
    /**
     * Check if user has any of the specified roles
     */
    hasRole(userId: string, roleNames: string[]): Promise<boolean>;
    /**
     * Generate password reset token
     */
    generatePasswordResetToken(email: string): Promise<string>;
    /**
     * Reset password using token
     */
    resetPassword(token: string, newPassword: string): Promise<void>;
    /**
     * Clean expired sessions
     */
    cleanExpiredSessions(): Promise<number>;
}
//# sourceMappingURL=auth.d.ts.map