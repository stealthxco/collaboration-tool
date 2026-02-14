import DatabaseService from '../services/database';
import RedisService from '../services/redis';
import WebSocketService from '../websocket/socket';
async function collaborationRoutes(fastify, options) {
    const db = DatabaseService.getInstance();
    const redis = RedisService.getInstance();
    const ws = WebSocketService.getInstance();
    // GET /api/collaboration/boards/:boardId/stats - Get board collaboration statistics
    fastify.get('/boards/:boardId/stats', async (request, reply) => {
        try {
            const { boardId } = request.params;
            const stats = ws.getBoardStats(boardId);
            return reply.send({
                success: true,
                data: {
                    boardId,
                    ...stats,
                    timestamp: new Date().toISOString()
                }
            });
        }
        catch (error) {
            fastify.log.error('Error fetching board stats:', error);
            return reply.code(500).send({
                success: false,
                error: 'Failed to fetch board statistics'
            });
        }
    });
    // GET /api/collaboration/presence - Get user presence information
    fastify.get('/presence', async (request, reply) => {
        try {
            // Get all user presence keys from Redis
            const presenceKeys = await redis.client.keys('presence:*');
            const presenceData = [];
            for (const key of presenceKeys) {
                try {
                    const data = await redis.client.get(key);
                    if (data) {
                        const presence = JSON.parse(data);
                        presenceData.push(presence);
                    }
                }
                catch (parseError) {
                    fastify.log.warn(`Failed to parse presence data for key ${key}:`, parseError);
                }
            }
            return reply.send({
                success: true,
                data: presenceData
            });
        }
        catch (error) {
            fastify.log.error('Error fetching presence data:', error);
            return reply.code(500).send({
                success: false,
                error: 'Failed to fetch presence information'
            });
        }
    });
    // POST /api/collaboration/presence - Update user presence
    fastify.post('/presence', async (request, reply) => {
        try {
            const presence = request.body;
            if (!presence.userId) {
                return reply.code(400).send({
                    success: false,
                    error: 'User ID is required'
                });
            }
            // Update presence in Redis with TTL
            const presenceKey = `presence:${presence.userId}`;
            const presenceData = {
                ...presence,
                lastSeen: new Date().toISOString()
            };
            await redis.client.setex(presenceKey, 300, JSON.stringify(presenceData)); // 5 min TTL
            // Broadcast presence update
            ws.broadcastToBoard('global', 'presenceUpdate', presenceData);
            return reply.send({
                success: true,
                data: presenceData
            });
        }
        catch (error) {
            fastify.log.error('Error updating presence:', error);
            return reply.code(500).send({
                success: false,
                error: 'Failed to update presence'
            });
        }
    });
    // GET /api/collaboration/boards/:boardId/users - Get users in a specific board
    fastify.get('/boards/:boardId/users', async (request, reply) => {
        try {
            const { boardId } = request.params;
            // Get board presence from Redis
            const boardPresenceKeys = await redis.client.keys(`board:${boardId}:user:*`);
            const boardUsers = [];
            for (const key of boardPresenceKeys) {
                try {
                    const data = await redis.client.get(key);
                    if (data) {
                        const presence = JSON.parse(data);
                        boardUsers.push(presence);
                    }
                }
                catch (parseError) {
                    fastify.log.warn(`Failed to parse board presence for key ${key}:`, parseError);
                }
            }
            return reply.send({
                success: true,
                data: boardUsers
            });
        }
        catch (error) {
            fastify.log.error('Error fetching board users:', error);
            return reply.code(500).send({
                success: false,
                error: 'Failed to fetch board users'
            });
        }
    });
    // POST /api/collaboration/notifications - Send notification
    fastify.post('/notifications', async (request, reply) => {
        try {
            const notification = request.body;
            if (!notification.title || !notification.message) {
                return reply.code(400).send({
                    success: false,
                    error: 'Title and message are required'
                });
            }
            const notificationData = {
                id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                ...notification,
                timestamp: new Date().toISOString()
            };
            if (notification.userId) {
                // Send to specific user
                const notificationKey = `notifications:${notification.userId}`;
                await redis.client.lpush(notificationKey, JSON.stringify(notificationData));
                await redis.client.ltrim(notificationKey, 0, 99); // Keep only last 100 notifications
                // Send via WebSocket if user is online
                ws.sendToUser(notification.userId, 'notification', notificationData);
            }
            else {
                // Broadcast notification
                ws.broadcast('notification', notificationData);
            }
            return reply.send({
                success: true,
                data: notificationData
            });
        }
        catch (error) {
            fastify.log.error('Error sending notification:', error);
            return reply.code(500).send({
                success: false,
                error: 'Failed to send notification'
            });
        }
    });
    // GET /api/collaboration/notifications/:userId - Get user notifications
    fastify.get('/notifications/:userId', async (request, reply) => {
        try {
            const { userId } = request.params;
            const notificationKey = `notifications:${userId}`;
            const notifications = await redis.client.lrange(notificationKey, 0, 19); // Get last 20
            const parsedNotifications = notifications.map(n => {
                try {
                    return JSON.parse(n);
                }
                catch (e) {
                    fastify.log.warn('Failed to parse notification:', e);
                    return null;
                }
            }).filter(Boolean);
            return reply.send({
                success: true,
                data: parsedNotifications
            });
        }
        catch (error) {
            fastify.log.error('Error fetching notifications:', error);
            return reply.code(500).send({
                success: false,
                error: 'Failed to fetch notifications'
            });
        }
    });
    // GET /api/collaboration/health - Health check for collaboration service
    fastify.get('/health', async (request, reply) => {
        try {
            // Check Redis connection
            const redisPing = await redis.client.ping();
            const isRedisHealthy = redisPing === 'PONG';
            // Check WebSocket service
            const wsStats = ws.getStats();
            return reply.send({
                success: true,
                data: {
                    redis: {
                        status: isRedisHealthy ? 'healthy' : 'unhealthy',
                        ping: redisPing
                    },
                    websocket: {
                        status: 'healthy',
                        ...wsStats
                    },
                    timestamp: new Date().toISOString()
                }
            });
        }
        catch (error) {
            fastify.log.error('Collaboration health check failed:', error);
            return reply.code(500).send({
                success: false,
                error: 'Collaboration service unhealthy'
            });
        }
    });
}
export default collaborationRoutes;
//# sourceMappingURL=collaboration.js.map