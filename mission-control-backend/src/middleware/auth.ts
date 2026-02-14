import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/auth.js';
import { prisma } from '../services/database.js';

interface AuthRequest extends FastifyRequest {
  user?: {
    id: string;
    username: string;
    email: string;
    permissions: string[];
    roles: string[];
  };
}

const authService = new AuthService(prisma);

/**
 * Extract bearer token from request headers
 */
function extractBearerToken(request: FastifyRequest): string | null {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Authentication middleware - validates JWT token
 */
export async function authMiddleware(
  request: AuthRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const token = extractBearerToken(request);
    
    if (!token) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'No token provided'
      });
    }

    // Verify token
    const decoded = authService.verifyToken(token, 'access');
    
    if (!decoded || decoded.type !== 'access') {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Invalid token'
      });
    }

    // Get user with current permissions (in case roles changed)
    const userWithPermissions = await authService.getUserWithPermissions(decoded.userId);
    
    if (!userWithPermissions || !userWithPermissions.isActive) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'User not found or inactive'
      });
    }

    const permissions = authService.extractPermissions(userWithPermissions);
    const roles = userWithPermissions.userRoles.map(ur => ur.role.name);

    // Attach user info to request
    request.user = {
      id: userWithPermissions.id,
      username: userWithPermissions.username,
      email: userWithPermissions.email,
      permissions,
      roles
    };

  } catch (error) {
    return reply.code(401).send({
      error: 'Unauthorized',
      message: 'Invalid token'
    });
  }
}

/**
 * Permission-based authorization middleware
 */
export function requirePermission(resource: string, action: string) {
  return async (request: AuthRequest, reply: FastifyReply): Promise<void> => {
    if (!request.user) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const requiredPermission = `${resource}:${action}`;
    
    if (!request.user.permissions.includes(requiredPermission)) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: `Missing required permission: ${requiredPermission}`
      });
    }
  };
}

/**
 * Role-based authorization middleware
 */
export function requireRole(...roles: string[]) {
  return async (request: AuthRequest, reply: FastifyReply): Promise<void> => {
    if (!request.user) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const hasRole = roles.some(role => request.user!.roles.includes(role));
    
    if (!hasRole) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: `Missing required role. Required: ${roles.join(' or ')}`
      });
    }
  };
}

/**
 * Admin authorization middleware
 */
export async function requireAdmin(
  request: AuthRequest,
  reply: FastifyReply
): Promise<void> {
  await requireRole('admin')(request, reply);
}

/**
 * Optional authentication middleware - doesn't fail if no token
 */
export async function optionalAuth(
  request: AuthRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const token = extractBearerToken(request);
    
    if (!token) {
      return; // No token is fine for optional auth
    }

    const decoded = authService.verifyToken(token, 'access');
    
    if (decoded && decoded.type === 'access') {
      const userWithPermissions = await authService.getUserWithPermissions(decoded.userId);
      
      if (userWithPermissions && userWithPermissions.isActive) {
        const permissions = authService.extractPermissions(userWithPermissions);
        const roles = userWithPermissions.userRoles.map(ur => ur.role.name);

        request.user = {
          id: userWithPermissions.id,
          username: userWithPermissions.username,
          email: userWithPermissions.email,
          permissions,
          roles
        };
      }
    }
  } catch (error) {
    // Ignore errors in optional auth
  }
}

/**
 * Rate limiting middleware for auth endpoints
 */
export function authRateLimit(maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) {
  const attempts = new Map<string, { count: number; resetTime: number }>();

  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const clientId = request.ip || 'unknown';
    const now = Date.now();

    const clientAttempts = attempts.get(clientId);
    
    if (clientAttempts && now < clientAttempts.resetTime) {
      if (clientAttempts.count >= maxAttempts) {
        return reply.code(429).send({
          error: 'Too Many Requests',
          message: 'Too many authentication attempts. Please try again later.',
          retryAfter: Math.ceil((clientAttempts.resetTime - now) / 1000)
        });
      }
      clientAttempts.count++;
    } else {
      attempts.set(clientId, {
        count: 1,
        resetTime: now + windowMs
      });
    }

    // Clean up old entries periodically
    if (Math.random() < 0.01) { // 1% chance
      for (const [key, value] of attempts.entries()) {
        if (now >= value.resetTime) {
          attempts.delete(key);
        }
      }
    }
  };
}

/**
 * CSRF protection middleware (for cookie-based sessions)
 */
export async function csrfProtection(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const csrfHeader = request.headers['x-csrf-token'];
  const csrfCookie = (request as any).cookies?.['csrf-token'];

  if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
    return reply.code(403).send({
      error: 'Forbidden',
      message: 'CSRF token mismatch'
    });
  }
}

/**
 * Security headers middleware
 */
export async function securityHeaders(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  reply.headers({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'",
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  });
}

export { AuthRequest };