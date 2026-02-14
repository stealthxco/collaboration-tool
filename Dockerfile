# Multi-stage build for Mission Control Full Stack App using Workspaces

# Stage 1: Build everything using workspace
FROM node:18-alpine AS builder

WORKDIR /app

# Copy workspace configuration files
COPY package.json package-lock.json ./

# Copy workspace subdirectories  
COPY mission-control-backend/ ./mission-control-backend/
COPY mission-control-frontend/ ./mission-control-frontend/

# Install all dependencies via workspace
RUN npm ci --workspaces

# Build backend
RUN npm run build:backend

# Build frontend  
RUN npm run build:frontend

# Stage 2: Production image
FROM node:18-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copy workspace config
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

# Copy backend built files and dependencies
COPY --from=builder --chown=nodejs:nodejs /app/mission-control-backend/dist ./mission-control-backend/dist
COPY --from=builder --chown=nodejs:nodejs /app/mission-control-backend/node_modules ./mission-control-backend/node_modules
COPY --from=builder --chown=nodejs:nodejs /app/mission-control-backend/package.json ./mission-control-backend/
COPY --from=builder --chown=nodejs:nodejs /app/mission-control-backend/prisma ./mission-control-backend/prisma

# Copy frontend built files
COPY --from=builder --chown=nodejs:nodejs /app/mission-control-frontend/dist ./mission-control-frontend/dist

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Switch to non-root user
USER nodejs

# Expose the backend port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "http.get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the backend application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "mission-control-backend/dist/index.js"]