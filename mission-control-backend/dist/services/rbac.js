"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RBACService = void 0;
class RBACService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Create a new role
     */
    async createRole(data) {
        const { permissions, ...roleData } = data;
        const role = await this.prisma.role.create({
            data: roleData
        });
        if (permissions && permissions.length > 0) {
            await this.assignPermissionsToRole(role.id, permissions);
        }
        return role;
    }
    /**
     * Get role with permissions
     */
    async getRoleWithPermissions(roleId) {
        return this.prisma.role.findUnique({
            where: { id: roleId },
            include: {
                rolePermissions: {
                    include: {
                        permission: true
                    }
                }
            }
        });
    }
    /**
     * Get all roles
     */
    async getAllRoles() {
        return this.prisma.role.findMany({
            include: {
                rolePermissions: {
                    include: {
                        permission: true
                    }
                }
            },
            orderBy: { name: 'asc' }
        });
    }
    /**
     * Update role
     */
    async updateRole(roleId, data) {
        const { permissions, ...roleData } = data;
        const role = await this.prisma.role.update({
            where: { id: roleId },
            data: roleData
        });
        if (permissions !== undefined) {
            // Remove existing permissions
            await this.prisma.rolePermission.deleteMany({
                where: { roleId }
            });
            // Add new permissions
            if (permissions.length > 0) {
                await this.assignPermissionsToRole(roleId, permissions);
            }
        }
        return role;
    }
    /**
     * Delete role
     */
    async deleteRole(roleId) {
        await this.prisma.role.delete({
            where: { id: roleId }
        });
    }
    /**
     * Create a new permission
     */
    async createPermission(data) {
        // Generate permission name if not provided
        if (!data.name) {
            data.name = `${data.resource}:${data.action}`;
        }
        return this.prisma.permission.create({
            data
        });
    }
    /**
     * Get all permissions
     */
    async getAllPermissions() {
        return this.prisma.permission.findMany({
            orderBy: [
                { resource: 'asc' },
                { action: 'asc' }
            ]
        });
    }
    /**
     * Get permissions by resource
     */
    async getPermissionsByResource(resource) {
        return this.prisma.permission.findMany({
            where: { resource },
            orderBy: { action: 'asc' }
        });
    }
    /**
     * Update permission
     */
    async updatePermission(permissionId, data) {
        return this.prisma.permission.update({
            where: { id: permissionId },
            data
        });
    }
    /**
     * Delete permission
     */
    async deletePermission(permissionId) {
        await this.prisma.permission.delete({
            where: { id: permissionId }
        });
    }
    /**
     * Assign permissions to role
     */
    async assignPermissionsToRole(roleId, permissionNames) {
        const permissions = await this.prisma.permission.findMany({
            where: {
                name: { in: permissionNames }
            }
        });
        const rolePermissions = permissions.map(permission => ({
            roleId,
            permissionId: permission.id
        }));
        await this.prisma.rolePermission.createMany({
            data: rolePermissions,
            skipDuplicates: true
        });
    }
    /**
     * Remove permissions from role
     */
    async removePermissionsFromRole(roleId, permissionNames) {
        const permissions = await this.prisma.permission.findMany({
            where: {
                name: { in: permissionNames }
            }
        });
        const permissionIds = permissions.map(p => p.id);
        await this.prisma.rolePermission.deleteMany({
            where: {
                roleId,
                permissionId: { in: permissionIds }
            }
        });
    }
    /**
     * Assign role to user
     */
    async assignRoleToUser(userId, roleName) {
        const role = await this.prisma.role.findUnique({
            where: { name: roleName }
        });
        if (!role) {
            throw new Error(`Role '${roleName}' not found`);
        }
        return this.prisma.userRole.create({
            data: {
                userId,
                roleId: role.id
            }
        });
    }
    /**
     * Remove role from user
     */
    async removeRoleFromUser(userId, roleName) {
        const role = await this.prisma.role.findUnique({
            where: { name: roleName }
        });
        if (!role) {
            throw new Error(`Role '${roleName}' not found`);
        }
        await this.prisma.userRole.deleteMany({
            where: {
                userId,
                roleId: role.id
            }
        });
    }
    /**
     * Get user roles and permissions
     */
    async getUserRolesAndPermissions(userId) {
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
     * Get users by role
     */
    async getUsersByRole(roleName) {
        const role = await this.prisma.role.findUnique({
            where: { name: roleName },
            include: {
                userRoles: {
                    include: {
                        user: true
                    }
                }
            }
        });
        return role?.userRoles.map(ur => ur.user) || [];
    }
    /**
     * Check if user has permission
     */
    async userHasPermission(userId, resource, action) {
        const userWithRoles = await this.getUserRolesAndPermissions(userId);
        if (!userWithRoles) {
            return false;
        }
        for (const userRole of userWithRoles.userRoles) {
            for (const rolePermission of userRole.role.rolePermissions) {
                const permission = rolePermission.permission;
                if (permission.resource === resource && permission.action === action) {
                    return true;
                }
            }
        }
        return false;
    }
    /**
     * Check if user has role
     */
    async userHasRole(userId, roleName) {
        const userRole = await this.prisma.userRole.findFirst({
            where: {
                userId,
                role: {
                    name: roleName
                }
            }
        });
        return !!userRole;
    }
    /**
     * Initialize default roles and permissions
     */
    async initializeDefaultRBAC() {
        // Create default permissions
        const defaultPermissions = [
            // User permissions
            { name: 'users:read', resource: 'users', action: 'read', description: 'View users' },
            { name: 'users:create', resource: 'users', action: 'create', description: 'Create new users' },
            { name: 'users:update', resource: 'users', action: 'update', description: 'Update user information' },
            { name: 'users:delete', resource: 'users', action: 'delete', description: 'Delete users' },
            // Mission permissions
            { name: 'missions:read', resource: 'missions', action: 'read', description: 'View missions' },
            { name: 'missions:create', resource: 'missions', action: 'create', description: 'Create new missions' },
            { name: 'missions:update', resource: 'missions', action: 'update', description: 'Update missions' },
            { name: 'missions:delete', resource: 'missions', action: 'delete', description: 'Delete missions' },
            { name: 'missions:assign', resource: 'missions', action: 'assign', description: 'Assign missions to agents/users' },
            // Agent permissions
            { name: 'agents:read', resource: 'agents', action: 'read', description: 'View agents' },
            { name: 'agents:create', resource: 'agents', action: 'create', description: 'Create new agents' },
            { name: 'agents:update', resource: 'agents', action: 'update', description: 'Update agent configurations' },
            { name: 'agents:delete', resource: 'agents', action: 'delete', description: 'Delete agents' },
            { name: 'agents:control', resource: 'agents', action: 'control', description: 'Control agent operations' },
            // Comment permissions
            { name: 'comments:read', resource: 'comments', action: 'read', description: 'View comments' },
            { name: 'comments:create', resource: 'comments', action: 'create', description: 'Create comments' },
            { name: 'comments:update', resource: 'comments', action: 'update', description: 'Update own comments' },
            { name: 'comments:delete', resource: 'comments', action: 'delete', description: 'Delete comments' },
            // Admin permissions
            { name: 'admin:users', resource: 'admin', action: 'users', description: 'Full user management' },
            { name: 'admin:roles', resource: 'admin', action: 'roles', description: 'Manage roles and permissions' },
            { name: 'admin:system', resource: 'admin', action: 'system', description: 'System administration' },
        ];
        for (const permData of defaultPermissions) {
            await this.prisma.permission.upsert({
                where: { name: permData.name },
                update: {},
                create: permData
            });
        }
        // Create default roles
        const adminRole = await this.prisma.role.upsert({
            where: { name: 'admin' },
            update: {},
            create: {
                name: 'admin',
                description: 'Full system administrator with all permissions',
                isDefault: false
            }
        });
        const userRole = await this.prisma.role.upsert({
            where: { name: 'user' },
            update: {},
            create: {
                name: 'user',
                description: 'Standard user with basic permissions',
                isDefault: true
            }
        });
        const operatorRole = await this.prisma.role.upsert({
            where: { name: 'operator' },
            update: {},
            create: {
                name: 'operator',
                description: 'Mission operator with mission and agent management permissions',
                isDefault: false
            }
        });
        // Assign permissions to admin role (all permissions)
        const allPermissions = await this.prisma.permission.findMany();
        const adminPermissions = allPermissions.map(p => ({
            roleId: adminRole.id,
            permissionId: p.id
        }));
        await this.prisma.rolePermission.createMany({
            data: adminPermissions,
            skipDuplicates: true
        });
        // Assign basic permissions to user role
        const userPermissions = [
            'missions:read',
            'agents:read',
            'comments:read',
            'comments:create',
            'comments:update'
        ];
        await this.assignPermissionsToRole(userRole.id, userPermissions);
        // Assign operator permissions
        const operatorPermissions = [
            'missions:read',
            'missions:create',
            'missions:update',
            'missions:assign',
            'agents:read',
            'agents:update',
            'agents:control',
            'comments:read',
            'comments:create',
            'comments:update',
            'comments:delete',
            'users:read'
        ];
        await this.assignPermissionsToRole(operatorRole.id, operatorPermissions);
    }
    /**
     * Get role statistics
     */
    async getRoleStatistics() {
        const roles = await this.prisma.role.findMany({
            include: {
                userRoles: true
            }
        });
        const stats = {};
        for (const role of roles) {
            stats[role.name] = role.userRoles.length;
        }
        return stats;
    }
    /**
     * Bulk assign roles to users
     */
    async bulkAssignRoles(userIds, roleNames) {
        const roles = await this.prisma.role.findMany({
            where: {
                name: { in: roleNames }
            }
        });
        const userRoles = [];
        for (const userId of userIds) {
            for (const role of roles) {
                userRoles.push({
                    userId,
                    roleId: role.id
                });
            }
        }
        await this.prisma.userRole.createMany({
            data: userRoles,
            skipDuplicates: true
        });
    }
}
exports.RBACService = RBACService;
//# sourceMappingURL=rbac.js.map