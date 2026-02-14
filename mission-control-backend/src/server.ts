import fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
// import websocket from '@fastify/websocket'; // MINIMAL BUILD: Disabled WebSocket
import dotenv from 'dotenv';

// Import services
import DatabaseService from './services/database';
// import RedisService from './services/redis'; // MINIMAL BUILD: Disabled Redis
// import WebSocketService from './websocket/socket'; // MINIMAL BUILD: Disabled WebSocket

// Import routes
import healthRoutes from './routes/health';
import agentRoutes from './routes/agents';
import missionRoutes from './routes/missions';
import commentRoutes from './routes/comments';
import authRoutes from './routes/auth';

// Import middleware
import { securityHeaders } from './middleware/auth';

// Load environment variables
dotenv.config();

interface ServerOptions {
  port?: number;
  host?: string;
  logger?: boolean;
}

class Server {
  private app: FastifyInstance;
  private db: DatabaseService;
  // private redis: RedisService; // MINIMAL BUILD: Disabled Redis
  // private ws: WebSocketService; // MINIMAL BUILD: Disabled WebSocket

  constructor(options: ServerOptions = {}) {
    this.app = fastify({
      logger: options.logger !== false ? {
        level: process.env.NODE_ENV === 'development' ? 'info' : 'warn',
        transport: process.env.NODE_ENV === 'development' 
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'yyyy-mm-dd HH:MM:ss',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
      } : false,
    });

    // Initialize services
    this.db = DatabaseService.getInstance();
    // this.redis = RedisService.getInstance(); // MINIMAL BUILD: Disabled Redis
    // this.ws = WebSocketService.getInstance(); // MINIMAL BUILD: Disabled WebSocket

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandlers();
  }

  private async setupMiddleware(): Promise<void> {
    // CORS
    await this.app.register(cors, {
      origin: process.env.NODE_ENV === 'development' 
        ? true 
        : (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','),
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    // WebSocket support
    // await this.app.register(websocket); // MINIMAL BUILD: Disabled WebSocket

    // Security headers middleware
    this.app.addHook('onRequest', securityHeaders);

    // Request logging middleware
    this.app.addHook('onRequest', async (request, reply) => {
      request.startTime = Date.now();
    });

    this.app.addHook('onResponse', async (request, reply) => {
      const responseTime = Date.now() - (request.startTime || 0);
      this.app.log.info({
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        responseTime: `${responseTime}ms`,
      });
    });

    // Content type parser for JSON
    this.app.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
      try {
        const json = JSON.parse(body as string);
        done(null, json);
      } catch (err) {
        done(err as Error, undefined);
      }
    });
  }

  private async setupRoutes(): Promise<void> {
    // Health checks (no /api prefix)
    await this.app.register(healthRoutes);

    // API routes
    await this.app.register(async (fastify) => {
      await fastify.register(authRoutes, { prefix: '/api/auth' });
      await fastify.register(agentRoutes, { prefix: '/api/agents' });
      await fastify.register(missionRoutes, { prefix: '/api/missions' });
      await fastify.register(commentRoutes, { prefix: '/api/comments' });
    });

    // Root route
    this.app.get('/', async (request, reply) => {
      return {
        name: 'Mission Control Backend',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        docs: {
          health: '/health',
          auth: '/api/auth',
          agents: '/api/agents',
          missions: '/api/missions',
          comments: '/api/comments',
        },
      };
    });

    // 404 handler
    this.app.setNotFoundHandler(async (request, reply) => {
      return reply.status(404).send({
        success: false,
        error: 'Route not found',
        path: request.url,
        method: request.method,
      });
    });
  }

  private setupErrorHandlers(): void {
    // Global error handler
    this.app.setErrorHandler(async (error, request, reply) => {
      this.app.log.error({
        error: error.message,
        stack: error.stack,
        method: request.method,
        url: request.url,
      }, 'Unhandled error');

      // Don't expose internal errors in production
      const message = process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'Internal server error';

      return reply.status(500).send({
        success: false,
        error: message,
        timestamp: new Date().toISOString(),
      });
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      this.app.log.info(`Received ${signal}, starting graceful shutdown...`);
      
      try {
        // Close Fastify server
        await this.app.close();
        
        // Disconnect from services
        await this.db.disconnect();
        // await this.redis.disconnect(); // MINIMAL BUILD: Disabled Redis
        
        this.app.log.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        this.app.log.error(error, 'Error during graceful shutdown');
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }

  async start(port?: number, host?: string): Promise<void> {
    const serverPort = port || parseInt(process.env.PORT || '3000', 10);
    const serverHost = host || process.env.HOST || 'localhost';

    try {
      // Connect to services
      await this.db.connect();
      // await this.redis.connect(); // MINIMAL BUILD: Disabled Redis
      
      // Initialize WebSocket
      // this.ws.initialize(this.app); // MINIMAL BUILD: Disabled WebSocket

      // Start server
      await this.app.listen({ port: serverPort, host: serverHost });
      
      console.log(`
🚀 Mission Control Backend is running!

  🌐 Server: http://${serverHost}:${serverPort}
  📊 Health: http://${serverHost}:${serverPort}/health
  📚 API: http://${serverHost}:${serverPort}/api
  🔌 WebSocket: ws://${serverHost}:${serverPort}
  
  Environment: ${process.env.NODE_ENV || 'development'}
      `);
    } catch (error) {
      this.app.log.error(error, 'Failed to start server');
      process.exit(1);
    }
  }

  // Getter for the Fastify instance (useful for testing)
  get instance(): FastifyInstance {
    return this.app;
  }
}

export default Server;

// Auto-start if this file is run directly
if (require.main === module) {
  const server = new Server();
  server.start().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}