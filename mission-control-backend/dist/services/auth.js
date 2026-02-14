import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
export class AuthService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Hash password using bcrypt
     */
    async hashPassword(password) {
        return bcrypt.hash(password, SALT_ROUNDS);
    }
    /**
     * Verify password against hash
     */
    async verifyPassword(password, hash) {
        return bcrypt.compare(password, hash);
    }
    /**
     * Generate JWT access token
     */
    generateAccessToken(userId, permissions = []) {
        return jwt.sign({
            userId,
            permissions,
            type: 'access'
        }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
    }
    /**
     * Generate JWT refresh token
     */
    generateRefreshToken(userId) {
        return jwt.sign({
            userId,
            type: 'refresh',
            jti: randomBytes(16).toString('hex') // Unique token ID for revocation
        }, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
    }
    /**
     * Verify JWT token
     */
    verifyToken(token, type = 'access') {
        const secret = type === 'access' ? JWT_SECRET : JWT_REFRESH_SECRET;
        return jwt.verify(token, secret);
    }
    /**
     * Get user with roles and permissions
     */
    async getUserWithPermissions(userId) {
        return this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                userRoles: {
                    include: {
                        role: {
                            include: {
                                rolePermissions: {
                                    include: {
                                        permission: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
    }
    /**
     * Extract permissions from user with roles
     */
    extractPermissions(userWithRoles) {
        const permissions = new Set();
        userWithRoles.userRoles.forEach(userRole => {
            userRole.role.rolePermissions.forEach(rolePermission => {
                const perm = rolePermission.permission;
                permissions.add(`${perm.resource}:${perm.action}`);
            });
        });
        return Array.from(permissions);
    }
    /**
     * Register a new user
     */
    async register(data) {
        // Check if user already exists
        const existingUser = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { email: data.email },
                    { username: data.username }
                ]
            }
        });
        if (existingUser) {
            throw new Error('User with this email or username already exists');
        }
        // Hash password
        const hashedPassword = await this.hashPassword(data.password);
        // Create user
        const user = await this.prisma.user.create({
            data: {
                username: data.username,
                email: data.email,
                password: hashedPassword,
                firstName: data.firstName,
                lastName: data.lastName,
            }
        });
        // Assign default role
        const defaultRole = await this.prisma.role.findFirst({
            where: { isDefault: true }
        });
        if (defaultRole) {
            await this.prisma.userRole.create({
                data: {
                    userId: user.id,
                    roleId: defaultRole.id
                }
            });
        }
        // Generate tokens
        const userWithPermissions = await this.getUserWithPermissions(user.id);
        const permissions = userWithPermissions ? this.extractPermissions(userWithPermissions) : [];
        const tokens = await this.generateTokenPair(user.id, permissions);
        return { user, tokens };
    }
    /**
     * Login user
     */
    async login(data) {
        // Find user
        const user = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { email: data.username },
                    { username: data.username }
                ],
                isActive: true
            }
        });
        if (!user || !user.password) {
            throw new Error('Invalid credentials');
        }
        // Verify password
        const isValidPassword = await this.verifyPassword(data.password, user.password);
        if (!isValidPassword) {
            throw new Error('Invalid credentials');
        }
        // Update last login
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() }
        });
        // Generate tokens
        const userWithPermissions = await this.getUserWithPermissions(user.id);
        const permissions = userWithPermissions ? this.extractPermissions(userWithPermissions) : [];
        const tokens = await this.generateTokenPair(user.id, permissions);
        return { user, tokens };
    }
    /**
     * Generate token pair and store refresh token
     */
    async generateTokenPair(userId, permissions = []) {
        const accessToken = this.generateAccessToken(userId, permissions);
        const refreshToken = this.generateRefreshToken(userId);
        // Store refresh token in database
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        await this.prisma.session.create({
            data: {
                userId,
                token: refreshToken,
                type: 'REFRESH',
                expiresAt
            }
        });
        return {
            accessToken,
            refreshToken,
            expiresIn: 15 * 60 // 15 minutes in seconds
        };
    }
    /**
     * Refresh tokens
     */
    async refreshTokens(refreshToken) {
        try {
            // Verify refresh token
            const decoded = this.verifyToken(refreshToken, 'refresh');
            // Check if token exists and is not revoked
            const session = await this.prisma.session.findFirst({
                where: {
                    token: refreshToken,
                    type: 'REFRESH',
                    isRevoked: false,
                    expiresAt: { gt: new Date() }
                }
            });
            if (!session) {
                throw new Error('Invalid refresh token');
            }
            // Get user with permissions
            const userWithPermissions = await this.getUserWithPermissions(session.userId);
            if (!userWithPermissions || !userWithPermissions.isActive) {
                throw new Error('User not found or inactive');
            }
            const permissions = this.extractPermissions(userWithPermissions);
            // Revoke old refresh token
            await this.prisma.session.update({
                where: { id: session.id },
                data: { isRevoked: true }
            });
            // Generate new tokens
            return this.generateTokenPair(session.userId, permissions);
        }
        catch (error) {
            throw new Error('Invalid refresh token');
        }
    }
    /**
     * Logout user (revoke refresh token)
     */
    async logout(refreshToken) {
        await this.prisma.session.updateMany({
            where: {
                token: refreshToken,
                isRevoked: false
            },
            data: {
                isRevoked: true
            }
        });
    }
    /**
     * Logout all sessions for a user
     */
    async logoutAll(userId) {
        await this.prisma.session.updateMany({
            where: {
                userId,
                type: 'REFRESH',
                isRevoked: false
            },
            data: {
                isRevoked: true
            }
        });
    }
    /**
     * Check if user has specific permission
     */
    async hasPermission(userId, resource, action) {
        const userWithPermissions = await this.getUserWithPermissions(userId);
        if (!userWithPermissions)
            return false;
        const permissions = this.extractPermissions(userWithPermissions);
        return permissions.includes(`${resource}:${action}`);
    }
    /**
     * Check if user has any of the specified roles
     */
    async hasRole(userId, roleNames) {
        const userWithRoles = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                userRoles: {
                    include: {
                        role: true
                    }
                }
            }
        });
        if (!userWithRoles)
            return false;
        const userRoleNames = userWithRoles.userRoles.map(ur => ur.role.name);
        return roleNames.some(roleName => userRoleNames.includes(roleName));
    }
    /**
     * Generate password reset token
     */
    async generatePasswordResetToken(email) {
        const user = await this.prisma.user.findUnique({
            where: { email, isActive: true }
        });
        if (!user) {
            throw new Error('User not found');
        }
        const token = randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await this.prisma.session.create({
            data: {
                userId: user.id,
                token,
                type: 'RESET_PASSWORD',
                expiresAt
            }
        });
        return token;
    }
    /**
     * Reset password using token
     */
    async resetPassword(token, newPassword) {
        const session = await this.prisma.session.findFirst({
            where: {
                token,
                type: 'RESET_PASSWORD',
                isRevoked: false,
                expiresAt: { gt: new Date() }
            }
        });
        if (!session) {
            throw new Error('Invalid or expired reset token');
        }
        const hashedPassword = await this.hashPassword(newPassword);
        // Update password and revoke reset token
        await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: session.userId },
                data: { password: hashedPassword }
            }),
            this.prisma.session.update({
                where: { id: session.id },
                data: { isRevoked: true }
            })
        ]);
    }
    /**
     * Clean expired sessions
     */
    async cleanExpiredSessions() {
        const result = await this.prisma.session.deleteMany({
            where: {
                OR: [
                    { expiresAt: { lt: new Date() } },
                    { isRevoked: true }
                ]
            }
        });
        return result.count;
    }
}
//# sourceMappingURL=auth.js.map