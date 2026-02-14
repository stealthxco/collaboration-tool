import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { CreateCommentRequest, ApiResponse, PaginatedResponse, CommentWithDetails } from '../types';
import DatabaseService from '../services/database';
// import RedisService from '../services/redis'; // MINIMAL BUILD: Disabled Redis
// import WebSocketService from '../websocket/socket'; // MINIMAL BUILD: Disabled WebSocket

async function commentRoutes(fastify: FastifyInstance, options: FastifyPluginOptions): Promise<void> {
  const db = DatabaseService.getInstance();
  // const redis = RedisService.getInstance(); // MINIMAL BUILD: Disabled Redis
  // const ws = WebSocketService.getInstance(); // MINIMAL BUILD: Disabled WebSocket

  // GET /api/comments - List all comments with pagination
  fastify.get<{
    Querystring: { 
      page?: number; 
      limit?: number; 
      type?: string; 
      agentId?: string; 
      missionId?: string;
    }
  }>('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { 
        page = 1, 
        limit = 10, 
        type, 
        agentId, 
        missionId 
      } = request.query as any;
      const skip = (page - 1) * limit;

      // Build cache key
      const cacheKey = `comments:page:${page}:limit:${limit}:type:${type || 'all'}:agent:${agentId || 'all'}:mission:${missionId || 'all'}`;
      // const cached = await redis.get<PaginatedResponse<CommentWithDetails>>(cacheKey); // MINIMAL BUILD: Cache disabled
      
      // if (cached) {
      //   return reply.send(cached);
      // }

      // Build where clause
      const where: any = {};
      if (type) where.type = type;
      if (agentId) where.agentId = agentId;
      if (missionId) where.missionId = missionId;

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

      const response: PaginatedResponse<CommentWithDetails> = {
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
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch comments',
      });
    }
  });

  // GET /api/comments/:id - Get specific comment
  fastify.get<{
    Params: { id: string }
  }>('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;

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
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch comment',
      });
    }
  });

  // POST /api/comments - Create new comment
  fastify.post<{
    Body: CreateCommentRequest
  }>('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const commentData = request.body as CreateCommentRequest;

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
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to create comment',
      });
    }
  });

  // PATCH /api/comments/:id - Update comment
  fastify.patch<{
    Params: { id: string };
    Body: { content?: string; type?: string; metadata?: Record<string, any> };
  }>('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const updateData = request.body as any;

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
    } catch (error) {
      fastify.log.error(error);
      
      if ((error as any).code === 'P2025') {
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
  fastify.delete<{
    Params: { id: string }
  }>('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;

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
    } catch (error) {
      fastify.log.error(error);
      
      if ((error as any).code === 'P2025') {
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

export default commentRoutes;