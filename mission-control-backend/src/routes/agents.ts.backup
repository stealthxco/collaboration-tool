import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { CreateAgentRequest, UpdateAgentRequest, ApiResponse, PaginatedResponse, AgentWithMissions } from '../types';
import DatabaseService from '../services/database';
import RedisService from '../services/redis';
import WebSocketService from '../websocket/socket';

async function agentRoutes(fastify: FastifyInstance, options: FastifyPluginOptions): Promise<void> {
  const db = DatabaseService.getInstance();
  const redis = RedisService.getInstance();
  const ws = WebSocketService.getInstance();

  // GET /api/agents - List all agents with pagination
  fastify.get<{
    Querystring: { page?: number; limit?: number; status?: string }
  }>('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { page = 1, limit = 10, status } = request.query as any;
      const skip = (page - 1) * limit;

      // Check cache first
      const cacheKey = `agents:page:${page}:limit:${limit}:status:${status || 'all'}`;
      const cached = await redis.get<PaginatedResponse<AgentWithMissions>>(cacheKey);
      
      if (cached) {
        return reply.send(cached);
      }

      const where = status ? { status: status as any } : {};

      const [agents, total] = await Promise.all([
        db.prisma.agent.findMany({
          where,
          include: {
            missions: true,
            comments: {
              take: 5,
              orderBy: { createdAt: 'desc' },
            },
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        db.prisma.agent.count({ where }),
      ]);

      const response: PaginatedResponse<AgentWithMissions> = {
        success: true,
        data: agents,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };

      // Cache for 2 minutes
      await redis.set(cacheKey, response, 120);

      return reply.send(response);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch agents',
      });
    }
  });

  // GET /api/agents/:id - Get specific agent
  fastify.get<{
    Params: { id: string }
  }>('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;

      // Check cache first
      const cacheKey = `agent:${id}`;
      const cached = await redis.get<AgentWithMissions>(cacheKey);
      
      if (cached) {
        return reply.send({ success: true, data: cached });
      }

      const agent = await db.prisma.agent.findUnique({
        where: { id },
        include: {
          missions: {
            orderBy: { createdAt: 'desc' },
          },
          comments: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!agent) {
        return reply.status(404).send({
          success: false,
          error: 'Agent not found',
        });
      }

      // Cache for 5 minutes
      await redis.set(cacheKey, agent, 300);

      return reply.send({ success: true, data: agent });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch agent',
      });
    }
  });

  // POST /api/agents - Create new agent
  fastify.post<{
    Body: CreateAgentRequest
  }>('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const agentData = request.body as CreateAgentRequest;

      const agent = await db.prisma.agent.create({
        data: {
          name: agentData.name,
          description: agentData.description,
          capabilities: agentData.capabilities || [],
          metadata: agentData.metadata,
        },
        include: {
          missions: true,
          comments: true,
        },
      });

      // Invalidate cache
      await redis.del('agents:*');

      // Broadcast update
      ws.broadcastSystemNotification('info', `New agent created: ${agent.name}`);

      return reply.status(201).send({
        success: true,
        data: agent,
        message: 'Agent created successfully',
      });
    } catch (error) {
      fastify.log.error(error);
      
      if ((error as any).code === 'P2002') {
        return reply.status(400).send({
          success: false,
          error: 'Agent name already exists',
        });
      }

      return reply.status(500).send({
        success: false,
        error: 'Failed to create agent',
      });
    }
  });

  // PATCH /api/agents/:id - Update agent
  fastify.patch<{
    Params: { id: string };
    Body: UpdateAgentRequest;
  }>('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;
      const updateData = request.body as UpdateAgentRequest;

      const agent = await db.prisma.agent.update({
        where: { id },
        data: updateData,
        include: {
          missions: true,
          comments: true,
        },
      });

      // Invalidate cache
      await redis.del(`agent:${id}`);
      await redis.del('agents:*');

      // Broadcast status update if status changed
      if (updateData.status) {
        ws.broadcastAgentStatusUpdate(id, updateData.status);
      }

      return reply.send({
        success: true,
        data: agent,
        message: 'Agent updated successfully',
      });
    } catch (error) {
      fastify.log.error(error);
      
      if ((error as any).code === 'P2025') {
        return reply.status(404).send({
          success: false,
          error: 'Agent not found',
        });
      }

      return reply.status(500).send({
        success: false,
        error: 'Failed to update agent',
      });
    }
  });

  // DELETE /api/agents/:id - Delete agent
  fastify.delete<{
    Params: { id: string }
  }>('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as any;

      const agent = await db.prisma.agent.delete({
        where: { id },
      });

      // Invalidate cache
      await redis.del(`agent:${id}`);
      await redis.del('agents:*');

      // Broadcast update
      ws.broadcastSystemNotification('warning', `Agent deleted: ${agent.name}`);

      return reply.send({
        success: true,
        message: 'Agent deleted successfully',
      });
    } catch (error) {
      fastify.log.error(error);
      
      if ((error as any).code === 'P2025') {
        return reply.status(404).send({
          success: false,
          error: 'Agent not found',
        });
      }

      return reply.status(500).send({
        success: false,
        error: 'Failed to delete agent',
      });
    }
  });
}

export default agentRoutes;