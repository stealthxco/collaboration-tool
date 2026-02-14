"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../services/database"));
// import RedisService from '../services/redis'; // MINIMAL BUILD: Disabled Redis
// import WebSocketService from '../websocket/socket'; // MINIMAL BUILD: Disabled WebSocket
async function missionRoutes(fastify, options) {
    const db = database_1.default.getInstance();
    // const redis = RedisService.getInstance(); // MINIMAL BUILD: Disabled Redis
    // const ws = WebSocketService.getInstance(); // MINIMAL BUILD: Disabled WebSocket
    // GET /api/missions - List all missions with pagination
    fastify.get('/', async (request, reply) => {
        try {
            const { page = 1, limit = 10, status, agentId, priority } = request.query;
            const skip = (page - 1) * limit;
            // Build cache key
            const cacheKey = `missions:page:${page}:limit:${limit}:status:${status || 'all'}:agent:${agentId || 'all'}:priority:${priority || 'all'}`;
            // const cached = await redis.get<PaginatedResponse<MissionWithDetails>>(cacheKey); // MINIMAL BUILD: Cache disabled
            // if (cached) {
            //   return reply.send(cached);
            // }
            // Build where clause
            const where = {};
            if (status)
                where.status = status;
            if (agentId)
                where.agentId = agentId;
            if (priority)
                where.priority = priority;
            const [missions, total] = await Promise.all([
                db.prisma.mission.findMany({
                    where,
                    include: {
                        agent: true,
                        comments: {
                            take: 5,
                            orderBy: { createdAt: 'desc' },
                            include: {
                                agent: true,
                            },
                        },
                    },
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                }),
                db.prisma.mission.count({ where }),
            ]);
            const response = {
                success: true,
                data: missions,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
            // Cache for 1 minute (missions change frequently)
            // await redis.set // MINIMAL BUILD: Cache disabled(cacheKey, response, 60);
            return reply.send(response);
        }
        catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({
                success: false,
                error: 'Failed to fetch missions',
            });
        }
    });
    // GET /api/missions/:id - Get specific mission
    fastify.get('/:id', async (request, reply) => {
        try {
            const { id } = request.params;
            // Check cache first
            const cacheKey = `mission:${id}`;
            // const cached = await redis.get<MissionWithDetails>(cacheKey); // MINIMAL BUILD: Cache disabled
            // if (cached) {
            //   return reply.send({ success: true, data: cached });
            // }
            const mission = await db.prisma.mission.findUnique({
                where: { id },
                include: {
                    agent: true,
                    comments: {
                        orderBy: { createdAt: 'desc' },
                        include: {
                            agent: true,
                        },
                    },
                },
            });
            if (!mission) {
                return reply.status(404).send({
                    success: false,
                    error: 'Mission not found',
                });
            }
            // Cache for 2 minutes
            // await redis.set // MINIMAL BUILD: Cache disabled(cacheKey, mission, 120);
            return reply.send({ success: true, data: mission });
        }
        catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({
                success: false,
                error: 'Failed to fetch mission',
            });
        }
    });
    // POST /api/missions - Create new mission
    fastify.post('/', async (request, reply) => {
        try {
            const missionData = request.body;
            // Validate agent exists if agentId is provided
            if (missionData.agentId) {
                const agent = await db.prisma.agent.findUnique({
                    where: { id: missionData.agentId },
                });
                if (!agent) {
                    return reply.status(400).send({
                        success: false,
                        error: 'Invalid agent ID',
                    });
                }
            }
            const mission = await db.prisma.mission.create({
                data: {
                    title: missionData.title,
                    description: missionData.description,
                    priority: missionData.priority || 'MEDIUM',
                    agentId: missionData.agentId,
                    metadata: missionData.metadata,
                },
                include: {
                    agent: true,
                    comments: true,
                },
            });
            // Invalidate cache
            // await redis.del // MINIMAL BUILD: Cache disabled('missions:*');
            if (missionData.agentId) {
                // await redis.del // MINIMAL BUILD: Cache disabled(`agent:${missionData.agentId}`);
            }
            // Broadcast update
            // ws.broadcast // MINIMAL BUILD: WebSocket disabledSystemNotification('info', `New mission created: ${mission.title}`);
            if (mission.agentId) {
                // ws.broadcast // MINIMAL BUILD: WebSocket disabledMissionUpdate(mission.id, mission.status, mission.progress);
            }
            return reply.status(201).send({
                success: true,
                data: mission,
                message: 'Mission created successfully',
            });
        }
        catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({
                success: false,
                error: 'Failed to create mission',
            });
        }
    });
    // PATCH /api/missions/:id - Update mission
    fastify.patch('/:id', async (request, reply) => {
        try {
            const { id } = request.params;
            const updateData = request.body;
            // Validate agent exists if agentId is being updated
            if (updateData.agentId) {
                const agent = await db.prisma.agent.findUnique({
                    where: { id: updateData.agentId },
                });
                if (!agent) {
                    return reply.status(400).send({
                        success: false,
                        error: 'Invalid agent ID',
                    });
                }
            }
            // Get current mission for comparison
            const currentMission = await db.prisma.mission.findUnique({
                where: { id },
            });
            if (!currentMission) {
                return reply.status(404).send({
                    success: false,
                    error: 'Mission not found',
                });
            }
            // Update completion time if status is changing to COMPLETED
            const dataToUpdate = { ...updateData };
            if (updateData.status === 'COMPLETED' && currentMission.status !== 'COMPLETED') {
                dataToUpdate.completedAt = new Date();
                dataToUpdate.progress = 100;
            }
            else if (updateData.status === 'IN_PROGRESS' && !currentMission.startedAt) {
                dataToUpdate.startedAt = new Date();
            }
            const mission = await db.prisma.mission.update({
                where: { id },
                data: dataToUpdate,
                include: {
                    agent: true,
                    comments: true,
                },
            });
            // Invalidate cache
            // await redis.del // MINIMAL BUILD: Cache disabled(`mission:${id}`);
            // await redis.del // MINIMAL BUILD: Cache disabled('missions:*');
            if (currentMission.agentId) {
                // await redis.del // MINIMAL BUILD: Cache disabled(`agent:${currentMission.agentId}`);
            }
            if (updateData.agentId && updateData.agentId !== currentMission.agentId) {
                // await redis.del // MINIMAL BUILD: Cache disabled(`agent:${updateData.agentId}`);
            }
            // Broadcast updates
            if (updateData.status || updateData.progress !== undefined) {
                // ws.broadcast // MINIMAL BUILD: WebSocket disabledMissionUpdate(id, mission.status, mission.progress);
            }
            if (updateData.status === 'COMPLETED') {
                // ws.broadcast // MINIMAL BUILD: WebSocket disabledSystemNotification('success', `Mission completed: ${mission.title}`);
            }
            return reply.send({
                success: true,
                data: mission,
                message: 'Mission updated successfully',
            });
        }
        catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({
                success: false,
                error: 'Failed to update mission',
            });
        }
    });
    // DELETE /api/missions/:id - Delete mission
    fastify.delete('/:id', async (request, reply) => {
        try {
            const { id } = request.params;
            const mission = await db.prisma.mission.delete({
                where: { id },
            });
            // Invalidate cache
            // await redis.del // MINIMAL BUILD: Cache disabled(`mission:${id}`);
            // await redis.del // MINIMAL BUILD: Cache disabled('missions:*');
            if (mission.agentId) {
                // await redis.del // MINIMAL BUILD: Cache disabled(`agent:${mission.agentId}`);
            }
            // Broadcast update
            // ws.broadcast // MINIMAL BUILD: WebSocket disabledSystemNotification('warning', `Mission deleted: ${mission.title}`);
            return reply.send({
                success: true,
                message: 'Mission deleted successfully',
            });
        }
        catch (error) {
            fastify.log.error(error);
            if (error.code === 'P2025') {
                return reply.status(404).send({
                    success: false,
                    error: 'Mission not found',
                });
            }
            return reply.status(500).send({
                success: false,
                error: 'Failed to delete mission',
            });
        }
    });
    // GET /api/missions/:id/progress - Get mission progress
    fastify.get('/:id/progress', async (request, reply) => {
        try {
            const { id } = request.params;
            const mission = await db.prisma.mission.findUnique({
                where: { id },
                select: {
                    id: true,
                    title: true,
                    status: true,
                    progress: true,
                    startedAt: true,
                    completedAt: true,
                },
            });
            if (!mission) {
                return reply.status(404).send({
                    success: false,
                    error: 'Mission not found',
                });
            }
            return reply.send({ success: true, data: mission });
        }
        catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({
                success: false,
                error: 'Failed to fetch mission progress',
            });
        }
    });
}
exports.default = missionRoutes;
//# sourceMappingURL=missions.js.map