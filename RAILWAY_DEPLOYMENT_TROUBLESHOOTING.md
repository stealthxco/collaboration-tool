# Railway Deployment Troubleshooting Guide

This guide addresses common Railway deployment issues for Mission Control and provides solutions to get your application live.

## 🔧 Quick Fix Script

If you're experiencing deployment issues, run the automated fix script first:

```bash
./scripts/railway-fix-deploy.sh
```

This script addresses the most common configuration issues automatically.

## 🚨 Common Issues & Solutions

### 1. Authentication Issues

**Problem**: `Unauthorized. Please login with 'railway login'`

**Solution**:
```bash
# Install Railway CLI if not installed
curl -fsSL https://railway.app/install.sh | sh

# Login to Railway
railway login

# Verify login
railway whoami
```

### 2. Build Failures

**Problem**: Build fails with dependency or Prisma errors

**Symptoms**:
- `Prisma CLI not found`
- `Cannot find module '@prisma/client'`
- `npm ERR! peer dep missing`

**Solution**:
```bash
# Use the optimized railway.toml configurations
# These have been updated with proper build commands

# For backend - check mission-control-backend/railway.toml:
# buildCommand = "npm ci --include=dev && npx prisma generate && npm run build"

# Redeploy with force flag
cd mission-control-backend
railway up --force
```

### 3. Database Connection Issues

**Problem**: App can't connect to database

**Symptoms**:
- `Connection refused`
- `Database connection timeout`
- `Prisma client not found`

**Solution**:
```bash
# Ensure PostgreSQL addon is added
railway add postgresql

# Check database variables
railway variables | grep -i postgres

# Run migrations manually if needed
railway run npx prisma migrate deploy

# Check database URL format
railway variables get DATABASE_URL
```

### 4. Service Configuration Issues

**Problem**: Railway doesn't recognize services or uses wrong configuration

**Symptoms**:
- Services not detected
- Wrong start command
- Port binding issues

**Solution**:
The project now includes:
- Updated `railway.json` with proper service configuration
- Individual `railway.toml` files for each service
- `nixpacks.toml` files for build optimization

**Verify configurations**:
```bash
# Check root railway.json exists and has correct structure
cat railway.json

# Check individual service configs
cat mission-control-backend/railway.toml
cat mission-control-frontend/railway.toml
```

### 5. Environment Variable Issues

**Problem**: Missing or incorrect environment variables

**Symptoms**:
- `JWT_SECRET is not defined`
- `CORS errors`
- `API URL not found`

**Solution**:
```bash
# Check current variables
railway variables

# Set missing variables
railway variables set JWT_SECRET="$(openssl rand -base64 32)"
railway variables set NODE_ENV="production"
railway variables set LOG_LEVEL="info"

# For frontend (replace with actual backend URL)
railway variables set VITE_API_URL="https://your-backend-url.railway.app"
railway variables set VITE_WS_URL="wss://your-backend-url.railway.app"

# For backend CORS (replace with actual frontend URL)
railway variables set CORS_ORIGIN="https://your-frontend-url.railway.app"
```

### 6. Start Command Issues

**Problem**: Application fails to start

**Symptoms**:
- `Process exited with code 1`
- `Command not found`
- `Port already in use`

**Solution**:
**Backend**: Should use: `npx prisma migrate deploy && npm start`
**Frontend**: Should use: `npm run preview -- --port $PORT --host 0.0.0.0`

```bash
# Check package.json scripts
cat mission-control-backend/package.json | grep -A5 scripts
cat mission-control-frontend/package.json | grep -A5 scripts

# Verify the main and start script exist
```

### 7. CORS and API Connection Issues

**Problem**: Frontend can't connect to backend

**Symptoms**:
- `CORS policy error`
- `Network Error`
- `Failed to fetch`

**Solution**:
```bash
# Get service URLs
railway status

# Update CORS origin with frontend URL
railway variables set CORS_ORIGIN="https://mission-control-frontend-production.up.railway.app"

# Update frontend API URL with backend URL
railway variables set VITE_API_URL="https://mission-control-backend-production.up.railway.app"
railway variables set VITE_WS_URL="wss://mission-control-backend-production.up.railway.app"

# Redeploy both services
railway up --service mission-control-backend
railway up --service mission-control-frontend
```

### 8. Health Check Failures

**Problem**: Railway reports service as unhealthy

**Symptoms**:
- Deployment succeeds but health check fails
- Service shows as "crashed"

**Solution**:
```bash
# Check if health endpoint exists
curl https://your-backend-url.railway.app/health

# Check application logs
railway logs --service mission-control-backend

# Verify health check configuration in railway.toml
grep -A3 "healthcheck" mission-control-backend/railway.toml
```

## 🔍 Diagnostic Commands

### Check Current Status
```bash
# Overall project status
railway status

# View all environment variables
railway variables

# Check service logs
railway logs --service mission-control-backend
railway logs --service mission-control-frontend

# View recent deployments
railway logs --deployment
```

### Test Endpoints
```bash
# Get service URLs from status
BACKEND_URL=$(railway status --json | jq -r '.services[] | select(.name=="mission-control-backend") | .url')
FRONTEND_URL=$(railway status --json | jq -r '.services[] | select(.name=="mission-control-frontend") | .url')

# Test backend health
curl "$BACKEND_URL/health"

# Test frontend
curl "$FRONTEND_URL"
```

## 🚀 Manual Deployment Steps

If the automated script doesn't work, follow these manual steps:

### Step 1: Clean Setup
```bash
# Ensure you're in the project root
cd mission-control

# Login to Railway
railway login

# Link or create project
railway link  # or railway new mission-control
```

### Step 2: Add Services
```bash
# Add database services
railway add postgresql
railway add redis
```

### Step 3: Configure Environment
```bash
# Set basic variables
railway variables set NODE_ENV="production"
railway variables set JWT_SECRET="$(openssl rand -base64 32)"
railway variables set JWT_EXPIRES_IN="24h"
railway variables set LOG_LEVEL="info"
```

### Step 4: Deploy Backend
```bash
cd mission-control-backend
railway up --service mission-control-backend
cd ..
```

### Step 5: Deploy Frontend
```bash
# Get backend URL and configure frontend
BACKEND_URL=$(railway status --json | jq -r '.services[] | select(.name=="mission-control-backend") | .url')
railway variables set VITE_API_URL="$BACKEND_URL"
railway variables set VITE_WS_URL="${BACKEND_URL/https/wss}"

cd mission-control-frontend
railway up --service mission-control-frontend
cd ..
```

### Step 6: Update CORS
```bash
# Get frontend URL and update backend CORS
FRONTEND_URL=$(railway status --json | jq -r '.services[] | select(.name=="mission-control-frontend") | .url')
railway variables set CORS_ORIGIN="$FRONTEND_URL"

# Redeploy backend with new CORS
cd mission-control-backend
railway up --service mission-control-backend
cd ..
```

## 📊 Verification Checklist

After deployment, verify these items:

- [ ] `railway status` shows both services as "Success"
- [ ] Backend health endpoint responds: `curl <backend-url>/health`
- [ ] Frontend loads in browser
- [ ] No CORS errors in browser console
- [ ] WebSocket connections work (check browser Network tab)
- [ ] Database operations work (try login/register)

## 🆘 Getting Help

If issues persist:

1. **Check the logs**:
   ```bash
   railway logs --service mission-control-backend --follow
   railway logs --service mission-control-frontend --follow
   ```

2. **Railway Dashboard**: `railway open`

3. **Railway Community**:
   - Discord: [discord.gg/railway](https://discord.gg/railway)
   - Docs: [docs.railway.app](https://docs.railway.app)

4. **Share logs**: When asking for help, include:
   - Output of `railway status`
   - Relevant log snippets
   - Environment variable configuration (without secrets)

## 🔧 Configuration Files Reference

The following optimized configuration files have been created/updated:

- `railway.json` - Multi-service project configuration
- `mission-control-backend/railway.toml` - Backend service config
- `mission-control-frontend/railway.toml` - Frontend service config
- `mission-control-backend/nixpacks.toml` - Backend build optimization
- `mission-control-frontend/nixpacks.toml` - Frontend build optimization
- `scripts/railway-fix-deploy.sh` - Automated fix script

These configurations address common deployment issues and optimize the build process for Railway's environment.