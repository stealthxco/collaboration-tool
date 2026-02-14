export interface OAuthConfig {
    provider: string;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
}
export declare class OAuthService {
    private configs;
    constructor();
    addProvider(provider: string, config: OAuthConfig): void;
    getProvider(provider: string): OAuthConfig | undefined;
    getAvailableProviders(): string[];
    isConfigured(): boolean;
    generateAuthUrl(provider: string, state?: string): Promise<string>;
    handleCallback(provider: string, code: string, state?: string): Promise<any>;
    refreshToken(provider: string, refreshToken: string): Promise<any>;
}
export default OAuthService;
//# sourceMappingURL=oauth.d.ts.map