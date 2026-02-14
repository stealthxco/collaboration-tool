// Type augmentation for Fastify
import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    startTime?: number;
  }
}