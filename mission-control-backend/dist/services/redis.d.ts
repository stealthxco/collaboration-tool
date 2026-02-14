declare class RedisService {
    private static instance;
    private constructor();
    static getInstance(): RedisService;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    set(key: string, value: any, ttl?: number): Promise<void>;
    get<T = any>(key: string): Promise<T | null>;
    del(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    healthCheck(): Promise<boolean>;
}
export default RedisService;
//# sourceMappingURL=redis.d.ts.map