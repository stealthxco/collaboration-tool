import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse } from '../types';
import DatabaseService from '../services/database';
import RedisService from '../services/redis';
import WebSocketService from '../websocket/socket';

interface UserPresence {
  userId: string;
  username: string;
  avatar?: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: string;
  currentBoard?: string;
}

interface BoardStats {
  boardId: string;
  connectedUsers: number;
  activeEditors: number;
  users: any[];
}

interface NotificationRequest {
  userId?: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  actionUrl?: string;
}

async function collaborationRoutes(fastify: FastifyInstance, options: FastifyPluginOptions): Promise<void> {
  const db = DatabaseService.getInstance();
  const redis = RedisService.getInstance();
  const ws = WebSocketService.getInstance();

  // GET /api/collaboration/boards/:boardId/stats - Get board collaboration statistics
  fastify.get<{
    Params: { boardId: string }
  }>('/boards/:boardId/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { boardId } = request.params as any;
      
      const stats = ws.getBoardStats(boardId);
      
      return reply.send({
        success: true,
        data: {
          boardId,
          ...stats,
          timestamp: new Date().toISOString()
        }
      } as ApiResponse<BoardStats>);
    } catch (error) {
      fastify.log.error('Error fetching board stats:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch board statistics'
      } as ApiResponse<null>);
    }
  });

  // GET /api/collaboration/presence - Get user presence information
  fastify.get('/presence', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Get all user presence keys from Redis
      const presenceKeys = await redis.client.keys('presence:*');
      const presenceData: UserPresence[] = [];

      for (const key of presenceKeys) {
        try {
          const data = await redis.client.get(key);
          if (data) {
            const presence = JSON.parse(data) as UserPresence;
            presenceData.push(presence);
          }
        } catch (parseError) {
          fastify.log.warn(`Failed to parse presence data for key ${key}:`, parseError);
        }
      }

      return reply.send({
        success: true,
        data: presenceData
      } as ApiResponse<UserPresence[]>);
    } catch (error) {
      fastify.log.error('Error fetching presence data:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch presence information'
      } as ApiResponse<null>);
    }
  });

  // POST /api/collaboration/presence - Update user presence
  fastify.post<{
    Body: Partial<UserPresence>
  }>('/presence', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const presence = request.body as UserPresence;
      
      if (!presence.userId) {
        return reply.code(400).send({
          success: false,
          error: 'User ID is required'
        } as ApiResponse<null>);
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
      } as ApiResponse<UserPresence>);
    } catch (error) {
      fastify.log.error('Error updating presence:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to update presence'
      } as ApiResponse<null>);
    }
  });

  // GET /api/collaboration/boards/:boardId/users - Get users in a specific board
  fastify.get<{
    Params: { boardId: string }
  }>('/boards/:boardId/users', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { boardId } = request.params as any;
      
      // Get board presence from Redis
      const boardPresenceKeys = await redis.client.keys(`board:${boardId}:user:*`);
      const boardUsers: UserPresence[] = [];

      for (const key of boardPresenceKeys) {
        try {
          const data = await redis.client.get(key);
          if (data) {
            const presence = JSON.parse(data) as UserPresence;
            boardUsers.push(presence);
          }
        } catch (parseError) {
          fastify.log.warn(`Failed to parse board presence for key ${key}:`, parseError);
        }
      }

      return reply.send({
        success: true,
        data: boardUsers
      } as ApiResponse<UserPresence[]>);
    } catch (error) {
      fastify.log.error('Error fetching board users:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch board users'
      } as ApiResponse<null>);
    }
  });

  // POST /api/collaboration/notifications - Send notification
  fastify.post<{
    Body: NotificationRequest
  }>('/notifications', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const notification = request.body as NotificationRequest;
      
      if (!notification.title || !notification.message) {
        return reply.code(400).send({
          success: false,
          error: 'Title and message are required'
        } as ApiResponse<null>);
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
      } else {
        // Broadcast notification
        ws.broadcast('notification', notificationData);
      }

      return reply.send({
        success: true,
        data: notificationData
      } as ApiResponse<any>);
    } catch (error) {
      fastify.log.error('Error sending notification:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to send notification'
      } as ApiResponse<null>);
    }
  });

  // GET /api/collaboration/notifications/:userId - Get user notifications
  fastify.get<{
    Params: { userId: string }
  }>('/notifications/:userId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.params as any;
      const notificationKey = `notifications:${userId}`;
      
      const notifications = await redis.client.lrange(notificationKey, 0, 19); // Get last 20
      const parsedNotifications = notifications.map(n => {
        try {
          return JSON.parse(n);
        } catch (e) {
          fastify.log.warn('Failed to parse notification:', e);
          return null;
        }
      }).filter(Boolean);

      return reply.send({
        success: true,
        data: parsedNotifications
      } as ApiResponse<any[]>);
    } catch (error) {
      fastify.log.error('Error fetching notifications:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch notifications'
      } as ApiResponse<null>);
    }
  });

  // GET /api/collaboration/health - Health check for collaboration service
  fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
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
      } as ApiResponse<any>);
    } catch (error) {
      fastify.log.error('Collaboration health check failed:', error);
      return reply.code(500).send({
        success: false,
        error: 'Collaboration service unhealthy'
      } as ApiResponse<null>);
    }
  });
}

export default collaborationRoutes;