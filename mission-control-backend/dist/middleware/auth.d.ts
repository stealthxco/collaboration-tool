import { FastifyRequest, FastifyReply } from 'fastify';
interface AuthRequest extends FastifyRequest {
    user?: {
        id: string;
        username: string;
        email: string;
        permissions: string[];
        roles: string[];
    };
}
/**
 * Authentication middleware - validates JWT token
 */
export declare function authMiddleware(request: AuthRequest, reply: FastifyReply): Promise<void>;
/**
 * Permission-based authorization middleware
 */
export declare function requirePermission(resource: string, action: string): (request: AuthRequest, reply: FastifyReply) => Promise<void>;
/**
 * Role-based authorization middleware
 */
export declare function requireRole(...roles: string[]): (request: AuthRequest, reply: FastifyReply) => Promise<void>;
/**
 * Admin authorization middleware
 */
export declare function requireAdmin(request: AuthRequest, reply: FastifyReply): Promise<void>;
/**
 * Optional authentication middleware - doesn't fail if no token
 */
export declare function optionalAuth(request: AuthRequest, reply: FastifyReply): Promise<void>;
/**
 * Rate limiting middleware for auth endpoints
 */
export declare function authRateLimit(maxAttempts?: number, windowMs?: number): (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
/**
 * CSRF protection middleware (for cookie-based sessions)
 */
export declare function csrfProtection(request: FastifyRequest, reply: FastifyReply): Promise<void>;
/**
 * Security headers middleware
 */
export declare function securityHeaders(request: FastifyRequest, reply: FastifyReply): Promise<void>;
export { AuthRequest };
//# sourceMappingURL=auth.d.ts.map