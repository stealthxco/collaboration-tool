# Multi-stage build for Mission Control Full Stack App

# Stage 1: Build the backend
FROM node:18-alpine AS backend-builder

WORKDIR /app

# Copy backend files
COPY mission-control-backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci --only=production

# Copy backend source
COPY mission-control-backend/ ./

# Build backend
RUN npm run build

# Stage 2: Build the frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy frontend files
COPY mission-control-frontend/package*.json ./frontend/
WORKDIR /app/frontend
RUN npm ci

# Copy frontend source
COPY mission-control-frontend/ ./

# Build frontend for production
RUN npm run build

# Stage 3: Production image
FROM node:18-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copy backend built files and node_modules
COPY --from=backend-builder --chown=nodejs:nodejs /app/backend/dist ./backend/dist
COPY --from=backend-builder --chown=nodejs:nodejs /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder --chown=nodejs:nodejs /app/backend/package.json ./backend/
COPY --from=backend-builder --chown=nodejs:nodejs /app/backend/prisma ./backend/prisma

# Copy frontend built files
COPY --from=frontend-builder --chown=nodejs:nodejs /app/frontend/dist ./frontend/dist

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

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "backend/dist/index.js"]