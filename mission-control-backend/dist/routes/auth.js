"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = authRoutes;
const auth_js_1 = require("../services/auth.js");
const database_js_1 = require("../services/database.js");
const auth_js_2 = require("../middleware/auth.js");
// import oauthRoutes from './oauth.js'; // MINIMAL BUILD: Disabled OAuth
const authService = new auth_js_1.AuthService(database_js_1.prisma);
// Request/Response schemas for validation
const registerSchema = {
    type: 'object',
    required: ['username', 'email', 'password'],
    properties: {
        username: {
            type: 'string',
            minLength: 3,
            maxLength: 50,
            pattern: '^[a-zA-Z0-9_-]+$'
        },
        email: {
            type: 'string',
            format: 'email'
        },
        password: {
            type: 'string',
            minLength: 8,
            pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'
        },
        firstName: {
            type: 'string',
            maxLength: 50
        },
        lastName: {
            type: 'string',
            maxLength: 50
        }
    }
};
const loginSchema = {
    type: 'object',
    required: ['username', 'password'],
    properties: {
        username: {
            type: 'string',
            minLength: 1
        },
        password: {
            type: 'string',
            minLength: 1
        }
    }
};
const refreshSchema = {
    type: 'object',
    required: ['refreshToken'],
    properties: {
        refreshToken: {
            type: 'string'
        }
    }
};
const resetPasswordRequestSchema = {
    type: 'object',
    required: ['email'],
    properties: {
        email: {
            type: 'string',
            format: 'email'
        }
    }
};
const resetPasswordSchema = {
    type: 'object',
    required: ['token', 'password'],
    properties: {
        token: {
            type: 'string'
        },
        password: {
            type: 'string',
            minLength: 8,
            pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'
        }
    }
};
const changePasswordSchema = {
    type: 'object',
    required: ['currentPassword', 'newPassword'],
    properties: {
        currentPassword: {
            type: 'string'
        },
        newPassword: {
            type: 'string',
            minLength: 8,
            pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'
        }
    }
};
async function authRoutes(fastify) {
    // Apply rate limiting to auth routes
    await fastify.register(async function (fastify) {
        fastify.addHook('preHandler', (0, auth_js_2.authRateLimit)(10, 15 * 60 * 1000)); // 10 attempts per 15 minutes
        /**
         * Register new user
         * POST /auth/register
         */
        fastify.post('/register', {
            schema: {
                body: registerSchema,
                response: {
                    201: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean' },
                            message: { type: 'string' },
                            user: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    username: { type: 'string' },
                                    email: { type: 'string' },
                                    firstName: { type: 'string' },
                                    lastName: { type: 'string' },
                                    createdAt: { type: 'string' }
                                }
                            },
                            tokens: {
                                type: 'object',
                                properties: {
                                    accessToken: { type: 'string' },
                                    refreshToken: { type: 'string' },
                                    expiresIn: { type: 'number' }
                                }
                            }
                        }
                    }
                }
            }
        }, async (request, reply) => {
            try {
                const { user, tokens } = await authService.register(request.body);
                // Remove sensitive data from response
                const { password, ...userResponse } = user;
                reply.code(201).send({
                    success: true,
                    message: 'User registered successfully',
                    user: userResponse,
                    tokens
                });
            }
            catch (error) {
                reply.code(400).send({
                    success: false,
                    error: 'Registration failed',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        });
        /**
         * Login user
         * POST /auth/login
         */
        fastify.post('/login', {
            schema: {
                body: loginSchema,
                response: {
                    200: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean' },
                            message: { type: 'string' },
                            user: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    username: { type: 'string' },
                                    email: { type: 'string' },
                                    firstName: { type: 'string' },
                                    lastName: { type: 'string' },
                                    lastLoginAt: { type: 'string' }
                                }
                            },
                            tokens: {
                                type: 'object',
                                properties: {
                                    accessToken: { type: 'string' },
                                    refreshToken: { type: 'string' },
                                    expiresIn: { type: 'number' }
                                }
                            }
                        }
                    }
                }
            }
        }, async (request, reply) => {
            try {
                const { user, tokens } = await authService.login(request.body);
                // Remove sensitive data from response
                const { password, ...userResponse } = user;
                reply.send({
                    success: true,
                    message: 'Login successful',
                    user: userResponse,
                    tokens
                });
            }
            catch (error) {
                reply.code(401).send({
                    success: false,
                    error: 'Login failed',
                    message: error instanceof Error ? error.message : 'Invalid credentials'
                });
            }
        });
    });
    /**
     * Refresh access token
     * POST /auth/refresh
     */
    fastify.post('/refresh', {
        schema: {
            body: refreshSchema,
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        tokens: {
                            type: 'object',
                            properties: {
                                accessToken: { type: 'string' },
                                refreshToken: { type: 'string' },
                                expiresIn: { type: 'number' }
                            }
                        }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const tokens = await authService.refreshTokens(request.body.refreshToken);
            reply.send({
                success: true,
                tokens
            });
        }
        catch (error) {
            reply.code(401).send({
                success: false,
                error: 'Token refresh failed',
                message: error instanceof Error ? error.message : 'Invalid refresh token'
            });
        }
    });
    /**
     * Logout user
     * POST /auth/logout
     */
    fastify.post('/logout', {
        preHandler: [auth_js_2.authMiddleware],
        schema: {
            body: {
                type: 'object',
                properties: {
                    refreshToken: { type: 'string' }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { refreshToken } = request.body;
            if (refreshToken) {
                await authService.logout(refreshToken);
            }
            reply.send({
                success: true,
                message: 'Logout successful'
            });
        }
        catch (error) {
            reply.send({
                success: true,
                message: 'Logout successful' // Always return success for security
            });
        }
    });
    /**
     * Logout from all devices
     * POST /auth/logout-all
     */
    fastify.post('/logout-all', {
        preHandler: [auth_js_2.authMiddleware],
        schema: {
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            if (request.user) {
                await authService.logoutAll(request.user.id);
            }
            reply.send({
                success: true,
                message: 'Logged out from all devices'
            });
        }
        catch (error) {
            reply.code(500).send({
                success: false,
                error: 'Logout failed',
                message: 'Internal server error'
            });
        }
    });
    /**
     * Get current user profile
     * GET /auth/me
     */
    fastify.get('/me', {
        preHandler: [auth_js_2.authMiddleware],
        schema: {
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        user: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                username: { type: 'string' },
                                email: { type: 'string' },
                                firstName: { type: 'string' },
                                lastName: { type: 'string' },
                                avatar: { type: 'string' },
                                emailVerified: { type: 'boolean' },
                                lastLoginAt: { type: 'string' },
                                permissions: {
                                    type: 'array',
                                    items: { type: 'string' }
                                },
                                roles: {
                                    type: 'array',
                                    items: { type: 'string' }
                                }
                            }
                        }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            if (!request.user) {
                return reply.code(401).send({
                    success: false,
                    error: 'Unauthorized'
                });
            }
            const fullUser = await database_js_1.prisma.user.findUnique({
                where: { id: request.user.id }
            });
            if (!fullUser) {
                return reply.code(404).send({
                    success: false,
                    error: 'User not found'
                });
            }
            const { password, ...userResponse } = fullUser;
            reply.send({
                success: true,
                user: {
                    ...userResponse,
                    permissions: request.user.permissions,
                    roles: request.user.roles
                }
            });
        }
        catch (error) {
            reply.code(500).send({
                success: false,
                error: 'Internal server error'
            });
        }
    });
    /**
     * Request password reset
     * POST /auth/forgot-password
     */
    fastify.post('/forgot-password', {
        schema: {
            body: resetPasswordRequestSchema,
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const token = await authService.generatePasswordResetToken(request.body.email);
            // TODO: Send email with reset link
            // await emailService.sendPasswordResetEmail(request.body.email, token);
            reply.send({
                success: true,
                message: 'Password reset email sent'
            });
        }
        catch (error) {
            // Always return success for security (don't reveal if email exists)
            reply.send({
                success: true,
                message: 'If the email exists, a password reset link has been sent'
            });
        }
    });
    /**
     * Reset password with token
     * POST /auth/reset-password
     */
    fastify.post('/reset-password', {
        schema: {
            body: resetPasswordSchema,
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            await authService.resetPassword(request.body.token, request.body.password);
            reply.send({
                success: true,
                message: 'Password reset successful'
            });
        }
        catch (error) {
            reply.code(400).send({
                success: false,
                error: 'Password reset failed',
                message: error instanceof Error ? error.message : 'Invalid or expired token'
            });
        }
    });
    /**
     * Change password (requires current password)
     * POST /auth/change-password
     */
    fastify.post('/change-password', {
        preHandler: [auth_js_2.authMiddleware],
        schema: {
            body: changePasswordSchema,
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            if (!request.user) {
                return reply.code(401).send({
                    success: false,
                    error: 'Unauthorized'
                });
            }
            const { currentPassword, newPassword } = request.body;
            const user = await database_js_1.prisma.user.findUnique({
                where: { id: request.user.id }
            });
            if (!user || !user.password) {
                return reply.code(400).send({
                    success: false,
                    error: 'Invalid user'
                });
            }
            const isValidPassword = await authService.verifyPassword(currentPassword, user.password);
            if (!isValidPassword) {
                return reply.code(400).send({
                    success: false,
                    error: 'Invalid current password'
                });
            }
            const hashedNewPassword = await authService.hashPassword(newPassword);
            await database_js_1.prisma.user.update({
                where: { id: request.user.id },
                data: { password: hashedNewPassword }
            });
            // Logout all sessions to force re-authentication
            await authService.logoutAll(request.user.id);
            reply.send({
                success: true,
                message: 'Password changed successfully'
            });
        }
        catch (error) {
            reply.code(500).send({
                success: false,
                error: 'Internal server error'
            });
        }
    });
    /**
     * Validate token endpoint
     * GET /auth/validate
     */
    fastify.get('/validate', {
        preHandler: [auth_js_2.authMiddleware],
        schema: {
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        valid: { type: 'boolean' },
                        user: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                username: { type: 'string' },
                                permissions: {
                                    type: 'array',
                                    items: { type: 'string' }
                                },
                                roles: {
                                    type: 'array',
                                    items: { type: 'string' }
                                }
                            }
                        }
                    }
                }
            }
        }
    }, async (request, reply) => {
        reply.send({
            success: true,
            valid: true,
            user: request.user
        });
    });
    // Register OAuth routes
    // await fastify.register(oauthRoutes, { prefix: '/oauth' }); // MINIMAL BUILD: Disabled OAuth
}
//# sourceMappingURL=auth.js.map