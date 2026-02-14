"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../services/database"));
// import RedisService from '../services/redis'; // MINIMAL BUILD: Disabled Redis
// import WebSocketService from '../websocket/socket'; // MINIMAL BUILD: Disabled WebSocket
async function commentRoutes(fastify, options) {
    const db = database_1.default.getInstance();
    // const redis = RedisService.getInstance(); // MINIMAL BUILD: Disabled Redis
    // const ws = WebSocketService.getInstance(); // MINIMAL BUILD: Disabled WebSocket
    // GET /api/comments - List all comments with pagination
    fastify.get('/', async (request, reply) => {
        try {
            const { page = 1, limit = 10, type, agentId, missionId } = request.query;
            const skip = (page - 1) * limit;
            // Build cache key
            const cacheKey = `comments:page:${page}:limit:${limit}:type:${type || 'all'}:agent:${agentId || 'all'}:mission:${missionId || 'all'}`;
            // const cached = await redis.get<PaginatedResponse<CommentWithDetails>>(cacheKey); // MINIMAL BUILD: Cache disabled
            // if (cached) {
            //   return reply.send(cached);
            // }
            // Build where clause
            const where = {};
            if (type)
                where.type = type;
            if (agentId)
                where.agentId = agentId;
            if (missionId)
                where.missionId = missionId;
            const [comments, total] = await Promise.all([
                db.prisma.comment.findMany({
                    where,
                    include: {
                        agent: true,
                        mission: {
                            select: {
                                id: true,
                                title: true,
                                status: true,
                            },
                        },
                    },
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                }),
                db.prisma.comment.count({ where }),
            ]);
            const response = {
                success: true,
                data: comments,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
            // Cache for 30 seconds (comments change frequently)
            // await redis.set // MINIMAL BUILD: Cache disabled(cacheKey, response, 30);
            return reply.send(response);
        }
        catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({
                success: false,
                error: 'Failed to fetch comments',
            });
        }
    });
    // GET /api/comments/:id - Get specific comment
    fastify.get('/:id', async (request, reply) => {
        try {
            const { id } = request.params;
            const comment = await db.prisma.comment.findUnique({
                where: { id },
                include: {
                    agent: true,
                    mission: {
                        select: {
                            id: true,
                            title: true,
                            status: true,
                        },
                    },
                },
            });
            if (!comment) {
                return reply.status(404).send({
                    success: false,
                    error: 'Comment not found',
                });
            }
            return reply.send({ success: true, data: comment });
        }
        catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({
                success: false,
                error: 'Failed to fetch comment',
            });
        }
    });
    // POST /api/comments - Create new comment
    fastify.post('/', async (request, reply) => {
        try {
            const commentData = request.body;
            // Validate references exist
            if (commentData.agentId) {
                const agent = await db.prisma.agent.findUnique({
                    where: { id: commentData.agentId },
                });
                if (!agent) {
                    return reply.status(400).send({
                        success: false,
                        error: 'Invalid agent ID',
                    });
                }
            }
            if (commentData.missionId) {
                const mission = await db.prisma.mission.findUnique({
                    where: { id: commentData.missionId },
                });
                if (!mission) {
                    return reply.status(400).send({
                        success: false,
                        error: 'Invalid mission ID',
                    });
                }
            }
            // Must have at least one reference (agent or mission)
            if (!commentData.agentId && !commentData.missionId) {
                return reply.status(400).send({
                    success: false,
                    error: 'Comment must be associated with an agent or mission',
                });
            }
            const comment = await db.prisma.comment.create({
                data: {
                    content: commentData.content,
                    type: commentData.type || 'NOTE',
                    agentId: commentData.agentId,
                    missionId: commentData.missionId,
                    metadata: commentData.metadata,
                },
                include: {
                    agent: true,
                    mission: {
                        select: {
                            id: true,
                            title: true,
                            status: true,
                        },
                    },
                },
            });
            // Invalidate cache
            // await redis.del // MINIMAL BUILD: Cache disabled('comments:*');
            if (commentData.agentId) {
                // await redis.del // MINIMAL BUILD: Cache disabled(`agent:${commentData.agentId}`);
            }
            if (commentData.missionId) {
                // await redis.del // MINIMAL BUILD: Cache disabled(`mission:${commentData.missionId}`);
            }
            // Broadcast new comment
            // ws.broadcast // MINIMAL BUILD: WebSocket disabledNewComment(comment.id, commentData.agentId, commentData.missionId);
            // Create system notification for important comment types
            if (comment.type === 'ERROR' || comment.type === 'WARNING') {
                const entity = comment.agent?.name || comment.mission?.title || 'Unknown';
                // ws.broadcastSystemNotification( // MINIMAL BUILD: WebSocket disabled
                //   comment.type.toLowerCase(),
                //   `${comment.type}: ${entity} - ${comment.content.substring(0, 100)}`
                // );
            }
            return reply.status(201).send({
                success: true,
                data: comment,
                message: 'Comment created successfully',
            });
        }
        catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({
                success: false,
                error: 'Failed to create comment',
            });
        }
    });
    // PATCH /api/comments/:id - Update comment
    fastify.patch('/:id', async (request, reply) => {
        try {
            const { id } = request.params;
            const updateData = request.body;
            const comment = await db.prisma.comment.update({
                where: { id },
                data: updateData,
                include: {
                    agent: true,
                    mission: {
                        select: {
                            id: true,
                            title: true,
                            status: true,
                        },
                    },
                },
            });
            // Invalidate cache
            // await redis.del // MINIMAL BUILD: Cache disabled('comments:*');
            if (comment.agentId) {
                // await redis.del // MINIMAL BUILD: Cache disabled(`agent:${comment.agentId}`);
            }
            if (comment.missionId) {
                // await redis.del // MINIMAL BUILD: Cache disabled(`mission:${comment.missionId}`);
            }
            return reply.send({
                success: true,
                data: comment,
                message: 'Comment updated successfully',
            });
        }
        catch (error) {
            fastify.log.error(error);
            if (error.code === 'P2025') {
                return reply.status(404).send({
                    success: false,
                    error: 'Comment not found',
                });
            }
            return reply.status(500).send({
                success: false,
                error: 'Failed to update comment',
            });
        }
    });
    // DELETE /api/comments/:id - Delete comment
    fastify.delete('/:id', async (request, reply) => {
        try {
            const { id } = request.params;
            const comment = await db.prisma.comment.delete({
                where: { id },
            });
            // Invalidate cache
            // await redis.del // MINIMAL BUILD: Cache disabled('comments:*');
            if (comment.agentId) {
                // await redis.del // MINIMAL BUILD: Cache disabled(`agent:${comment.agentId}`);
            }
            if (comment.missionId) {
                // await redis.del // MINIMAL BUILD: Cache disabled(`mission:${comment.missionId}`);
            }
            return reply.send({
                success: true,
                message: 'Comment deleted successfully',
            });
        }
        catch (error) {
            fastify.log.error(error);
            if (error.code === 'P2025') {
                return reply.status(404).send({
                    success: false,
                    error: 'Comment not found',
                });
            }
            return reply.status(500).send({
                success: false,
                error: 'Failed to delete comment',
            });
        }
    });
}
exports.default = commentRoutes;
//# sourceMappingURL=comments.js.map