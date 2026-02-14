export default async function oauthRoutes(fastify) {
    // OAuth feature placeholder endpoints
    fastify.get('/providers', async (request, reply) => {
        return reply.send({
            success: true,
            data: {
                available: [],
                message: 'OAuth providers not configured yet'
            }
        });
    });
    fastify.get('/status', async (request, reply) => {
        return reply.send({
            success: true,
            data: {
                enabled: false,
                providers: [],
                message: 'OAuth authentication is not configured'
            }
        });
    });
    // Placeholder routes for future OAuth implementation
    fastify.get('/auth/:provider', async (request, reply) => {
        const { provider } = request.params;
        return reply.code(501).send({
            success: false,
            message: `OAuth authentication with ${provider} is not implemented yet`
        });
    });
    fastify.get('/callback/:provider', async (request, reply) => {
        const { provider } = request.params;
        return reply.code(501).send({
            success: false,
            message: `OAuth callback for ${provider} is not implemented yet`
        });
    });
}
//# sourceMappingURL=oauth.js.map