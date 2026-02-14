"use strict";
// Redis service disabled for minimal build
// This is a stub implementation that provides the same interface without Redis dependency
Object.defineProperty(exports, "__esModule", { value: true });
class RedisService {
    static instance;
    constructor() {
        console.log('⚠️ Redis service disabled (minimal build)');
    }
    static getInstance() {
        if (!RedisService.instance) {
            RedisService.instance = new RedisService();
        }
        return RedisService.instance;
    }
    async connect() {
        // No-op for minimal build
        console.log('ℹ️ Redis connection skipped (minimal build)');
    }
    async disconnect() {
        // No-op for minimal build
        console.log('ℹ️ Redis disconnection skipped (minimal build)');
    }
    async set(key, value, ttl) {
        // No-op for minimal build - data not cached
        console.log(`ℹ️ Redis set skipped for key: ${key} (minimal build)`);
    }
    async get(key) {
        // Always return null for minimal build - no caching
        console.log(`ℹ️ Redis get skipped for key: ${key} (minimal build)`);
        return null;
    }
    async del(key) {
        // No-op for minimal build
        console.log(`ℹ️ Redis delete skipped for key: ${key} (minimal build)`);
    }
    async exists(key) {
        // Always return false for minimal build
        console.log(`ℹ️ Redis exists check skipped for key: ${key} (minimal build)`);
        return false;
    }
    async healthCheck() {
        // Always return true for minimal build (no Redis to check)
        return true;
    }
}
exports.default = RedisService;
//# sourceMappingURL=redis.js.map