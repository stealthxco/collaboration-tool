#!/usr/bin/env tsx
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedAuth = seedAuth;
const client_1 = require("@prisma/client");
const rbac_js_1 = require("../services/rbac.js");
const auth_js_1 = require("../services/auth.js");
const prisma = new client_1.PrismaClient();
const rbacService = new rbac_js_1.RBACService(prisma);
const authService = new auth_js_1.AuthService(prisma);
async function seedAuth() {
    console.log('🌱 Seeding authentication system...');
    try {
        // Initialize default RBAC (roles, permissions, and associations)
        console.log('📝 Creating default roles and permissions...');
        await rbacService.initializeDefaultRBAC();
        // Create admin user if it doesn't exist
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@missioncontrol.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPassword123!';
        const adminUsername = process.env.ADMIN_USERNAME || 'admin';
        const existingAdmin = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: adminEmail },
                    { username: adminUsername }
                ]
            }
        });
        if (!existingAdmin) {
            console.log('👤 Creating admin user...');
            const { user } = await authService.register({
                username: adminUsername,
                email: adminEmail,
                password: adminPassword,
                firstName: 'System',
                lastName: 'Administrator'
            });
            // Assign admin role
            await rbacService.assignRoleToUser(user.id, 'admin');
            console.log(`✅ Admin user created: ${adminUsername} (${adminEmail})`);
            console.log(`⚠️  Default password: ${adminPassword}`);
            console.log('🔐 Please change the admin password after first login!');
        }
        else {
            console.log('👤 Admin user already exists, skipping creation');
            // Ensure admin has admin role
            const hasAdminRole = await rbacService.userHasRole(existingAdmin.id, 'admin');
            if (!hasAdminRole) {
                await rbacService.assignRoleToUser(existingAdmin.id, 'admin');
                console.log('✅ Admin role assigned to existing admin user');
            }
        }
        // Create demo users if in development
        if (process.env.NODE_ENV === 'development' || process.env.CREATE_DEMO_USERS === 'true') {
            console.log('🧪 Creating demo users...');
            const demoUsers = [
                {
                    username: 'operator1',
                    email: 'operator@missioncontrol.com',
                    password: 'OperatorPass123!',
                    firstName: 'Mission',
                    lastName: 'Operator',
                    role: 'operator'
                },
                {
                    username: 'user1',
                    email: 'user@missioncontrol.com',
                    password: 'UserPass123!',
                    firstName: 'Regular',
                    lastName: 'User',
                    role: 'user'
                }
            ];
            for (const demoUser of demoUsers) {
                const existingUser = await prisma.user.findFirst({
                    where: {
                        OR: [
                            { email: demoUser.email },
                            { username: demoUser.username }
                        ]
                    }
                });
                if (!existingUser) {
                    const { user } = await authService.register({
                        username: demoUser.username,
                        email: demoUser.email,
                        password: demoUser.password,
                        firstName: demoUser.firstName,
                        lastName: demoUser.lastName
                    });
                    await rbacService.assignRoleToUser(user.id, demoUser.role);
                    console.log(`✅ Demo user created: ${demoUser.username} (${demoUser.role})`);
                }
            }
        }
        // Display statistics
        console.log('\n📊 Authentication system statistics:');
        const roleStats = await rbacService.getRoleStatistics();
        for (const [roleName, userCount] of Object.entries(roleStats)) {
            console.log(`  ${roleName}: ${userCount} users`);
        }
        const totalUsers = await prisma.user.count();
        const totalRoles = await prisma.role.count();
        const totalPermissions = await prisma.permission.count();
        console.log(`\n📈 Totals:`);
        console.log(`  Users: ${totalUsers}`);
        console.log(`  Roles: ${totalRoles}`);
        console.log(`  Permissions: ${totalPermissions}`);
        console.log('\n✅ Authentication system seeding completed successfully!');
    }
    catch (error) {
        console.error('❌ Error seeding authentication system:', error);
        throw error;
    }
}
async function main() {
    try {
        await seedAuth();
    }
    catch (error) {
        console.error('Failed to seed database:', error);
        process.exit(1);
    }
    finally {
        await prisma.$disconnect();
    }
}
// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
//# sourceMappingURL=seed-auth.js.map