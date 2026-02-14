// Redis service disabled for minimal build
// This is a stub implementation that provides the same interface without Redis dependency

class RedisService {
  private static instance: RedisService;

  private constructor() {
    console.log('⚠️ Redis service disabled (minimal build)');
  }

  static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  async connect(): Promise<void> {
    // No-op for minimal build
    console.log('ℹ️ Redis connection skipped (minimal build)');
  }

  async disconnect(): Promise<void> {
    // No-op for minimal build
    console.log('ℹ️ Redis disconnection skipped (minimal build)');
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    // No-op for minimal build - data not cached
    console.log(`ℹ️ Redis set skipped for key: ${key} (minimal build)`);
  }

  async get<T = any>(key: string): Promise<T | null> {
    // Always return null for minimal build - no caching
    console.log(`ℹ️ Redis get skipped for key: ${key} (minimal build)`);
    return null;
  }

  async del(key: string): Promise<void> {
    // No-op for minimal build
    console.log(`ℹ️ Redis delete skipped for key: ${key} (minimal build)`);
  }

  async exists(key: string): Promise<boolean> {
    // Always return false for minimal build
    console.log(`ℹ️ Redis exists check skipped for key: ${key} (minimal build)`);
    return false;
  }

  async healthCheck(): Promise<boolean> {
    // Always return true for minimal build (no Redis to check)
    return true;
  }
}

export default RedisService;