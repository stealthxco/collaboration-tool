import Redis from 'ioredis';

class RedisService {
  private static instance: RedisService;
  public client: Redis;

  private constructor() {
    this.client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });

    this.client.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    this.client.on('error', (error) => {
      console.error('❌ Redis connection error:', error);
    });
  }

  static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
    } catch (error) {
      console.error('❌ Redis connection failed:', error);
      // Don't exit process for Redis - continue without cache
    }
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
    console.log('🔌 Redis disconnected');
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      if (ttl) {
        await this.client.setex(key, ttl, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Redis delete error:', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const pong = await this.client.ping();
      return pong === 'PONG';
    } catch (error) {
      console.error('Redis health check failed:', error);
      return false;
    }
  }
}

export default RedisService;