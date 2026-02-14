# Simplified Backend-only Dockerfile for Mission Control

FROM node:18-alpine AS production

WORKDIR /app

# Install dumb-init
RUN apk add --no-cache dumb-init

# Copy workspace root files for dependency resolution
COPY package.json package-lock.json ./

# Copy backend source and package files
COPY mission-control-backend/ ./mission-control-backend/

# Install ALL dependencies (including workspace deps)
RUN npm install

# Install backend-specific dependencies
WORKDIR /app/mission-control-backend
RUN npm install

# Build backend
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "http.get('http://localhost:3001/ping', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]