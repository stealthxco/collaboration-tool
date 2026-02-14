// Advanced features simplified for initial deployment
import { FastifyInstance } from 'fastify';
import { prisma } from '../services/database.js';

export default async function advancedRoutes(fastify: FastifyInstance) {
  
  // Simple search functionality using existing models
  fastify.get('/search', async (request, reply) => {
    const { query, type } = request.query as { query?: string; type?: string };
    
    if (!query) {
      return reply.code(400).send({ message: 'Search query is required' });
    }

    try {
      const results: any = {};

      // Search missions
      if (!type || type === 'missions') {
        results.missions = await prisma.mission.findMany({
          where: {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } }
            ]
          },
          include: {
            agent: true,
            user: true,
          },
          take: 10
        });
      }

      // Search agents
      if (!type || type === 'agents') {
        results.agents = await prisma.agent.findMany({
          where: {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } }
            ]
          },
          take: 10
        });
      }

      // Search users
      if (!type || type === 'users') {
        results.users = await prisma.user.findMany({
          where: {
            OR: [
              { username: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
              { firstName: { contains: query, mode: 'insensitive' } },
              { lastName: { contains: query, mode: 'insensitive' } }
            ]
          },
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
            isActive: true
          },
          take: 10
        });
      }

      return reply.send({
        query,
        results,
        total: Object.values(results).reduce((acc: number, arr: unknown) => acc + (Array.isArray(arr) ? arr.length : 0), 0)
      });
    } catch (error) {
      fastify.log.error('Search error:', error);
      return reply.code(500).send({ message: 'Search failed' });
    }
  });

  // Basic statistics endpoint
  fastify.get('/stats', async (request, reply) => {
    try {
      const stats = {
        missions: {
          total: await prisma.mission.count(),
          pending: await prisma.mission.count({ where: { status: 'PENDING' } }),
          inProgress: await prisma.mission.count({ where: { status: 'IN_PROGRESS' } }),
          completed: await prisma.mission.count({ where: { status: 'COMPLETED' } }),
          failed: await prisma.mission.count({ where: { status: 'FAILED' } })
        },
        agents: {
          total: await prisma.agent.count(),
          idle: await prisma.agent.count({ where: { status: 'IDLE' } }),
          busy: await prisma.agent.count({ where: { status: 'BUSY' } }),
          offline: await prisma.agent.count({ where: { status: 'OFFLINE' } }),
          error: await prisma.agent.count({ where: { status: 'ERROR' } })
        },
        users: {
          total: await prisma.user.count(),
          active: await prisma.user.count({ where: { isActive: true } })
        },
        comments: await prisma.comment.count()
      };

      return reply.send(stats);
    } catch (error) {
      fastify.log.error('Stats error:', error);
      return reply.code(500).send({ message: 'Failed to fetch statistics' });
    }
  });

  // Feature status endpoint for UI
  fastify.get('/features', async (request, reply) => {
    return reply.send({
      search: { enabled: true, description: 'Basic search across missions, agents, and users' },
      statistics: { enabled: true, description: 'Real-time system statistics' },
      templates: { enabled: false, description: 'Mission templates (coming soon)' },
      tags: { enabled: false, description: 'Tagging system (coming soon)' },
      fileManagement: { enabled: false, description: 'File management (coming soon)' },
      bulkOperations: { enabled: false, description: 'Bulk operations (coming soon)' },
      workflowRules: { enabled: false, description: 'Workflow automation (coming soon)' },
      analytics: { enabled: false, description: 'Advanced analytics (coming soon)' }
    });
  });
}