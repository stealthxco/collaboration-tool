import { FastifyInstance } from 'fastify';
interface ServerOptions {
    port?: number;
    host?: string;
    logger?: boolean;
}
declare class Server {
    private app;
    private db;
    private redis;
    private ws;
    constructor(options?: ServerOptions);
    private setupMiddleware;
    private setupRoutes;
    private setupErrorHandlers;
    start(port?: number, host?: string): Promise<void>;
    get instance(): FastifyInstance;
}
export default Server;
//# sourceMappingURL=server.d.ts.map