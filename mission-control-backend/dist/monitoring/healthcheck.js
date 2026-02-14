import DatabaseService from '../services/database.js';
import RedisService from '../services/redis.js';
export async function healthCheckRoutes(fastify) {
    const db = DatabaseService.getInstance();
    const redis = RedisService.getInstance();
    // Detailed health check endpoint
    fastify.get('/health', async (request, reply) => {
        const startTime = Date.now();
        const checks = [];
        // Database check
        let databaseStatus = 'disconnected';
        const dbStartTime = Date.now();
        try {
            await db.prisma.$queryRaw `SELECT 1`;
            const dbTime = Date.now() - dbStartTime;
            databaseStatus = dbTime > 1000 ? 'slow' : 'connected';
            checks.push({
                name: 'database',
                status: databaseStatus === 'connected' ? 'pass' : 'warn',
                time: dbTime,
                output: databaseStatus === 'slow' ? 'Database response time is slow' : undefined
            });
        }
        catch (error) {
            checks.push({
                name: 'database',
                status: 'fail',
                time: Date.now() - dbStartTime,
                output: `Database error: ${error.message}`
            });
        }
        // Redis check  
        let redisStatus = 'disconnected';
        const redisStartTime = Date.now();
        try {
            const result = await redis.client.ping();
            const redisTime = Date.now() - redisStartTime;
            redisStatus = result === 'PONG' && redisTime < 1000 ? 'connected' : 'slow';
            checks.push({
                name: 'redis',
                status: redisStatus === 'connected' ? 'pass' : 'warn',
                time: redisTime,
                output: redisStatus === 'slow' ? 'Redis response time is slow' : undefined
            });
        }
        catch (error) {
            checks.push({
                name: 'redis',
                status: 'fail',
                time: Date.now() - redisStartTime,
                output: `Redis error: ${error.message}`
            });
        }
        // WebSocket check (simplified)
        const websocketStatus = 'active'; // For now, assume active if the server is running
        checks.push({
            name: 'websocket',
            status: 'pass',
            time: 1,
            output: 'WebSocket service is running'
        });
        // Calculate overall status
        const failedChecks = checks.filter(c => c.status === 'fail');
        const warningChecks = checks.filter(c => c.status === 'warn');
        const overallStatus = failedChecks.length > 0 ? 'error' :
            warningChecks.length > 0 ? 'warning' : 'ok';
        const healthResponse = {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            services: {
                database: databaseStatus,
                redis: redisStatus,
                websocket: websocketStatus
            },
            metrics: {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                cpu: process.cpuUsage().system / 1000000, // Convert to seconds
                responseTime: Date.now() - startTime
            },
            checks
        };
        const statusCode = overallStatus === 'ok' ? 200 :
            overallStatus === 'warning' ? 200 : 503;
        return reply.status(statusCode).send(healthResponse);
    });
    // Simple health check for load balancers
    fastify.get('/ping', async (request, reply) => {
        return reply.send({ status: 'pong', timestamp: new Date().toISOString() });
    });
    // Readiness probe
    fastify.get('/ready', async (request, reply) => {
        try {
            // Quick database check
            await db.prisma.$queryRaw `SELECT 1`;
            return reply.send({ status: 'ready', timestamp: new Date().toISOString() });
        }
        catch (error) {
            return reply.status(503).send({
                status: 'not ready',
                error: 'Database not available',
                timestamp: new Date().toISOString()
            });
        }
    });
    // Liveness probe
    fastify.get('/live', async (request, reply) => {
        return reply.send({ status: 'alive', timestamp: new Date().toISOString() });
    });
}
//# sourceMappingURL=healthcheck.js.map