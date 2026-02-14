import { PrismaClient, Role, Permission, User, UserRole } from '@prisma/client';
export interface CreateRoleData {
    name: string;
    description?: string;
    permissions?: string[];
    isDefault?: boolean;
}
export interface CreatePermissionData {
    name: string;
    description?: string;
    resource: string;
    action: string;
}
export interface RoleWithPermissions extends Role {
    rolePermissions: Array<{
        permission: Permission;
    }>;
}
export interface UserWithRoles extends User {
    userRoles: Array<{
        role: RoleWithPermissions;
    }>;
}
export declare class RBACService {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * Create a new role
     */
    createRole(data: CreateRoleData): Promise<Role>;
    /**
     * Get role with permissions
     */
    getRoleWithPermissions(roleId: string): Promise<RoleWithPermissions | null>;
    /**
     * Get all roles
     */
    getAllRoles(): Promise<RoleWithPermissions[]>;
    /**
     * Update role
     */
    updateRole(roleId: string, data: Partial<CreateRoleData>): Promise<Role>;
    /**
     * Delete role
     */
    deleteRole(roleId: string): Promise<void>;
    /**
     * Create a new permission
     */
    createPermission(data: CreatePermissionData): Promise<Permission>;
    /**
     * Get all permissions
     */
    getAllPermissions(): Promise<Permission[]>;
    /**
     * Get permissions by resource
     */
    getPermissionsByResource(resource: string): Promise<Permission[]>;
    /**
     * Update permission
     */
    updatePermission(permissionId: string, data: Partial<CreatePermissionData>): Promise<Permission>;
    /**
     * Delete permission
     */
    deletePermission(permissionId: string): Promise<void>;
    /**
     * Assign permissions to role
     */
    assignPermissionsToRole(roleId: string, permissionNames: string[]): Promise<void>;
    /**
     * Remove permissions from role
     */
    removePermissionsFromRole(roleId: string, permissionNames: string[]): Promise<void>;
    /**
     * Assign role to user
     */
    assignRoleToUser(userId: string, roleName: string): Promise<UserRole>;
    /**
     * Remove role from user
     */
    removeRoleFromUser(userId: string, roleName: string): Promise<void>;
    /**
     * Get user roles and permissions
     */
    getUserRolesAndPermissions(userId: string): Promise<UserWithRoles | null>;
    /**
     * Get users by role
     */
    getUsersByRole(roleName: string): Promise<User[]>;
    /**
     * Check if user has permission
     */
    userHasPermission(userId: string, resource: string, action: string): Promise<boolean>;
    /**
     * Check if user has role
     */
    userHasRole(userId: string, roleName: string): Promise<boolean>;
    /**
     * Initialize default roles and permissions
     */
    initializeDefaultRBAC(): Promise<void>;
    /**
     * Get role statistics
     */
    getRoleStatistics(): Promise<{
        [roleName: string]: number;
    }>;
    /**
     * Bulk assign roles to users
     */
    bulkAssignRoles(userIds: string[], roleNames: string[]): Promise<void>;
}
//# sourceMappingURL=rbac.d.ts.map