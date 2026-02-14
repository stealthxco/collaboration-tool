import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../services/database.js';

export default async function oauthRoutes(fastify: FastifyInstance) {
  
  // OAuth feature placeholder endpoints
  fastify.get('/providers', async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({
      success: true,
      data: {
        available: [],
        message: 'OAuth providers not configured yet'
      }
    });
  });

  fastify.get('/status', async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({
      success: true,
      data: {
        enabled: false,
        providers: [],
        message: 'OAuth authentication is not configured'
      }
    });
  });

  // Placeholder routes for future OAuth implementation
  fastify.get('/auth/:provider', async (request: FastifyRequest, reply: FastifyReply) => {
    const { provider } = request.params as { provider: string };
    
    return reply.code(501).send({
      success: false,
      message: `OAuth authentication with ${provider} is not implemented yet`
    });
  });

  fastify.get('/callback/:provider', async (request: FastifyRequest, reply: FastifyReply) => {
    const { provider } = request.params as { provider: string };
    
    return reply.code(501).send({
      success: false,
      message: `OAuth callback for ${provider} is not implemented yet`
    });
  });
}