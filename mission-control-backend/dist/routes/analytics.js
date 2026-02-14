"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = analyticsRoutes;
const database_js_1 = require("../services/database.js");
async function analyticsRoutes(fastify) {
    // Get dashboard overview
    fastify.get('/overview', async (request, reply) => {
        try {
            const now = new Date();
            const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            // Basic mission statistics
            const missionStats = {
                total: await database_js_1.prisma.mission.count(),
                pending: await database_js_1.prisma.mission.count({ where: { status: 'PENDING' } }),
                inProgress: await database_js_1.prisma.mission.count({ where: { status: 'IN_PROGRESS' } }),
                completed: await database_js_1.prisma.mission.count({ where: { status: 'COMPLETED' } }),
                failed: await database_js_1.prisma.mission.count({ where: { status: 'FAILED' } }),
                recentlyCreated: await database_js_1.prisma.mission.count({
                    where: { createdAt: { gte: last7Days } }
                }),
                recentlyCompleted: await database_js_1.prisma.mission.count({
                    where: {
                        status: 'COMPLETED',
                        completedAt: { gte: last7Days }
                    }
                })
            };
            // Agent statistics
            const agentStats = {
                total: await database_js_1.prisma.agent.count(),
                idle: await database_js_1.prisma.agent.count({ where: { status: 'IDLE' } }),
                busy: await database_js_1.prisma.agent.count({ where: { status: 'BUSY' } }),
                offline: await database_js_1.prisma.agent.count({ where: { status: 'OFFLINE' } }),
                error: await database_js_1.prisma.agent.count({ where: { status: 'ERROR' } })
            };
            // User statistics
            const userStats = {
                total: await database_js_1.prisma.user.count(),
                active: await database_js_1.prisma.user.count({ where: { isActive: true } }),
                recentlyJoined: await database_js_1.prisma.user.count({
                    where: { createdAt: { gte: last30Days } }
                }),
                recentlyActive: await database_js_1.prisma.user.count({
                    where: {
                        lastLoginAt: { gte: last7Days },
                        isActive: true
                    }
                })
            };
            // Comment statistics
            const commentStats = {
                total: await database_js_1.prisma.comment.count(),
                recent: await database_js_1.prisma.comment.count({
                    where: { createdAt: { gte: last7Days } }
                })
            };
            // Priority distribution
            const priorityStats = {
                low: await database_js_1.prisma.mission.count({ where: { priority: 'LOW' } }),
                medium: await database_js_1.prisma.mission.count({ where: { priority: 'MEDIUM' } }),
                high: await database_js_1.prisma.mission.count({ where: { priority: 'HIGH' } }),
                urgent: await database_js_1.prisma.mission.count({ where: { priority: 'URGENT' } })
            };
            return reply.send({
                missions: missionStats,
                agents: agentStats,
                users: userStats,
                comments: commentStats,
                priorities: priorityStats,
                generatedAt: new Date().toISOString()
            });
        }
        catch (error) {
            fastify.log.error('Overview analytics error:', error);
            return reply.code(500).send({ message: 'Failed to fetch analytics overview' });
        }
    });
    // Get mission analytics
    fastify.get('/missions', async (request, reply) => {
        try {
            const query = request.query;
            let whereClause = {};
            // Date range filter
            if (query.dateRange) {
                whereClause.createdAt = {
                    gte: new Date(query.dateRange.start),
                    lte: new Date(query.dateRange.end)
                };
            }
            // Agent filter
            if (query.agentIds && query.agentIds.length > 0) {
                whereClause.agentId = { in: query.agentIds };
            }
            // User filter  
            if (query.userIds && query.userIds.length > 0) {
                whereClause.userId = { in: query.userIds };
            }
            // Status breakdown
            const statusBreakdown = await Promise.all([
                database_js_1.prisma.mission.count({ where: { ...whereClause, status: 'PENDING' } }),
                database_js_1.prisma.mission.count({ where: { ...whereClause, status: 'IN_PROGRESS' } }),
                database_js_1.prisma.mission.count({ where: { ...whereClause, status: 'COMPLETED' } }),
                database_js_1.prisma.mission.count({ where: { ...whereClause, status: 'FAILED' } }),
                database_js_1.prisma.mission.count({ where: { ...whereClause, status: 'CANCELLED' } })
            ]);
            // Priority breakdown
            const priorityBreakdown = await Promise.all([
                database_js_1.prisma.mission.count({ where: { ...whereClause, priority: 'LOW' } }),
                database_js_1.prisma.mission.count({ where: { ...whereClause, priority: 'MEDIUM' } }),
                database_js_1.prisma.mission.count({ where: { ...whereClause, priority: 'HIGH' } }),
                database_js_1.prisma.mission.count({ where: { ...whereClause, priority: 'URGENT' } })
            ]);
            // Average progress
            const avgProgress = await database_js_1.prisma.mission.aggregate({
                where: whereClause,
                _avg: { progress: true }
            });
            // Recent missions
            const recentMissions = await database_js_1.prisma.mission.findMany({
                where: whereClause,
                include: {
                    agent: { select: { id: true, name: true } },
                    user: { select: { id: true, username: true } }
                },
                orderBy: { createdAt: 'desc' },
                take: 10
            });
            return reply.send({
                statusBreakdown: {
                    pending: statusBreakdown[0],
                    inProgress: statusBreakdown[1],
                    completed: statusBreakdown[2],
                    failed: statusBreakdown[3],
                    cancelled: statusBreakdown[4]
                },
                priorityBreakdown: {
                    low: priorityBreakdown[0],
                    medium: priorityBreakdown[1],
                    high: priorityBreakdown[2],
                    urgent: priorityBreakdown[3]
                },
                averageProgress: avgProgress._avg.progress || 0,
                recentMissions,
                totalMissions: await database_js_1.prisma.mission.count({ where: whereClause })
            });
        }
        catch (error) {
            fastify.log.error('Mission analytics error:', error);
            return reply.code(500).send({ message: 'Failed to fetch mission analytics' });
        }
    });
    // Get agent analytics
    fastify.get('/agents', async (request, reply) => {
        try {
            const agents = await database_js_1.prisma.agent.findMany({
                include: {
                    _count: {
                        select: { missions: true }
                    }
                }
            });
            const agentAnalytics = agents.map(agent => ({
                id: agent.id,
                name: agent.name,
                status: agent.status,
                totalMissions: agent._count.missions,
                capabilities: agent.capabilities,
                lastUpdated: agent.updatedAt
            }));
            // Status distribution
            const statusDistribution = {
                idle: agents.filter(a => a.status === 'IDLE').length,
                busy: agents.filter(a => a.status === 'BUSY').length,
                offline: agents.filter(a => a.status === 'OFFLINE').length,
                error: agents.filter(a => a.status === 'ERROR').length
            };
            return reply.send({
                agents: agentAnalytics,
                statusDistribution,
                totalAgents: agents.length
            });
        }
        catch (error) {
            fastify.log.error('Agent analytics error:', error);
            return reply.code(500).send({ message: 'Failed to fetch agent analytics' });
        }
    });
    // Health endpoint
    fastify.get('/health', async (request, reply) => {
        return reply.send({
            status: 'ok',
            service: 'analytics',
            timestamp: new Date().toISOString()
        });
    });
}
//# sourceMappingURL=analytics.js.map