import Redis from 'ioredis';
class RedisService {
    static instance;
    client;
    constructor() {
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
    static getInstance() {
        if (!RedisService.instance) {
            RedisService.instance = new RedisService();
        }
        return RedisService.instance;
    }
    async connect() {
        try {
            await this.client.connect();
        }
        catch (error) {
            console.error('❌ Redis connection failed:', error);
            // Don't exit process for Redis - continue without cache
        }
    }
    async disconnect() {
        await this.client.quit();
        console.log('🔌 Redis disconnected');
    }
    async set(key, value, ttl) {
        try {
            const serializedValue = JSON.stringify(value);
            if (ttl) {
                await this.client.setex(key, ttl, serializedValue);
            }
            else {
                await this.client.set(key, serializedValue);
            }
        }
        catch (error) {
            console.error('Redis set error:', error);
        }
    }
    async get(key) {
        try {
            const value = await this.client.get(key);
            return value ? JSON.parse(value) : null;
        }
        catch (error) {
            console.error('Redis get error:', error);
            return null;
        }
    }
    async del(key) {
        try {
            await this.client.del(key);
        }
        catch (error) {
            console.error('Redis delete error:', error);
        }
    }
    async exists(key) {
        try {
            const result = await this.client.exists(key);
            return result === 1;
        }
        catch (error) {
            console.error('Redis exists error:', error);
            return false;
        }
    }
    async healthCheck() {
        try {
            const pong = await this.client.ping();
            return pong === 'PONG';
        }
        catch (error) {
            console.error('Redis health check failed:', error);
            return false;
        }
    }
}
export default RedisService;
//# sourceMappingURL=redis.js.map