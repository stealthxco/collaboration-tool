import DatabaseService from '../services/database';
import RedisService from '../services/redis';
import WebSocketService from '../websocket/socket';
async function healthRoutes(fastify, options) {
    const db = DatabaseService.getInstance();
    const redis = RedisService.getInstance();
    const ws = WebSocketService.getInstance();
    // GET /health - Basic health check
    fastify.get('/health', async (request, reply) => {
        try {
            const [dbHealth, redisHealth] = await Promise.all([
                db.healthCheck(),
                redis.healthCheck(),
            ]);
            const health = {
                status: 'ok',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                services: {
                    database: dbHealth ? 'healthy' : 'unhealthy',
                    redis: redisHealth ? 'healthy' : 'unhealthy',
                    websocket: ws.isHealthy() ? 'healthy' : 'unhealthy',
                },
                connections: {
                    websocket: ws.getConnectedClients(),
                },
                memory: {
                    used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
                    total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
                },
                environment: process.env.NODE_ENV || 'development',
            };
            const allHealthy = dbHealth && redisHealth && ws.isHealthy();
            const statusCode = allHealthy ? 200 : 503;
            return reply.status(statusCode).send({
                success: allHealthy,
                data: health,
            });
        }
        catch (error) {
            fastify.log.error(error, 'Health check failed');
            return reply.status(503).send({
                success: false,
                error: 'Health check failed',
                timestamp: new Date().toISOString(),
            });
        }
    });
    // GET /health/detailed - Detailed system information
    fastify.get('/health/detailed', async (request, reply) => {
        try {
            const [dbHealth, redisHealth] = await Promise.all([
                db.healthCheck(),
                redis.healthCheck(),
            ]);
            // Get database statistics
            let dbStats = null;
            try {
                const [agentCount, missionCount, commentCount] = await Promise.all([
                    db.prisma.agent.count(),
                    db.prisma.mission.count(),
                    db.prisma.comment.count(),
                ]);
                dbStats = {
                    agents: agentCount,
                    missions: missionCount,
                    comments: commentCount,
                };
            }
            catch (error) {
                fastify.log.warn(error, 'Could not fetch database statistics');
            }
            const health = {
                status: 'ok',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                version: process.version,
                platform: process.platform,
                architecture: process.arch,
                pid: process.pid,
                services: {
                    database: dbHealth ? 'healthy' : 'unhealthy',
                    redis: redisHealth ? 'healthy' : 'unhealthy',
                    websocket: ws.isHealthy() ? 'healthy' : 'unhealthy',
                },
                statistics: dbStats,
                connections: {
                    websocket: ws.getConnectedClients(),
                },
                memory: {
                    rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB',
                    heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
                    heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
                    external: Math.round(process.memoryUsage().external / 1024 / 1024) + 'MB',
                },
                environment: process.env.NODE_ENV || 'development',
                config: {
                    port: process.env.PORT || '3000',
                    host: process.env.HOST || 'localhost',
                    databaseUrl: process.env.DATABASE_URL ? '[CONFIGURED]' : '[NOT CONFIGURED]',
                    redisUrl: process.env.REDIS_URL ? '[CONFIGURED]' : '[NOT CONFIGURED]',
                    jwtSecret: process.env.JWT_SECRET ? '[CONFIGURED]' : '[NOT CONFIGURED]',
                },
            };
            const allHealthy = dbHealth && redisHealth && ws.isHealthy();
            const statusCode = allHealthy ? 200 : 503;
            return reply.status(statusCode).send({
                success: allHealthy,
                data: health,
            });
        }
        catch (error) {
            fastify.log.error(error, 'Detailed health check failed');
            return reply.status(503).send({
                success: false,
                error: 'Detailed health check failed',
                timestamp: new Date().toISOString(),
            });
        }
    });
    // GET /health/ready - Readiness probe (for Kubernetes)
    fastify.get('/health/ready', async (request, reply) => {
        try {
            const dbHealth = await db.healthCheck();
            if (dbHealth) {
                return reply.send({ status: 'ready' });
            }
            else {
                return reply.status(503).send({ status: 'not ready', reason: 'database not healthy' });
            }
        }
        catch (error) {
            fastify.log.error(error, 'Readiness check failed');
            return reply.status(503).send({ status: 'not ready', reason: 'readiness check failed' });
        }
    });
    // GET /health/live - Liveness probe (for Kubernetes)
    fastify.get('/health/live', async (request, reply) => {
        return reply.send({ status: 'alive', timestamp: new Date().toISOString() });
    });
}
export default healthRoutes;
//# sourceMappingURL=health.js.map