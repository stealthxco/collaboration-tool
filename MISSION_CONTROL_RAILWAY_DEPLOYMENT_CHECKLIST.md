# Mission Control Railway Deployment Checklist

Complete checklist for deploying Mission Control to Railway platform. Follow this step-by-step guide to get your application live in production.

## 🎯 Deployment Overview

**What we're deploying:**
- Frontend: React + Vite application
- Backend: Fastify + TypeScript API
- Database: PostgreSQL with Prisma ORM
- Cache: Redis for session storage and caching
- WebSockets: Real-time communication

**Final URLs (examples):**
- Frontend: `https://mission-control-frontend-production.up.railway.app`
- Backend API: `https://mission-control-backend-production.up.railway.app`

## 📋 Pre-Deployment Checklist

### ✅ Prerequisites

- [ ] Railway account created ([railway.app](https://railway.app))
- [ ] GitHub repository with Mission Control code
- [ ] Railway CLI installed (see `RAILWAY_CLI_SETUP_GUIDE.md`)
- [ ] Code committed and pushed to main branch
- [ ] Domain name ready (optional, for custom domains)

### ✅ Local Environment Verified

- [ ] Application runs locally with Docker Compose
- [ ] Database migrations work
- [ ] Frontend connects to backend
- [ ] WebSockets functional
- [ ] Health checks responding

Test locally:
```bash
# Start with Docker Compose
docker-compose up -d

# Verify services
curl http://localhost:3001/health
curl http://localhost:3000

# Stop services
docker-compose down
```

## 🚀 Step 1: Railway Project Setup

### 1.1 Install and Login

```bash
# Install Railway CLI
curl -fsSL https://railway.app/install.sh | sh

# Login to Railway
railway login

# Verify login
railway whoami
```

### 1.2 Create Railway Project

```bash
# Navigate to project root
cd mission-control

# Create new Railway project
railway new mission-control
# Or link existing project:
# railway link

# Verify project creation
railway status
```

## 🗄️ Step 2: Database Setup

### 2.1 Add PostgreSQL

```bash
# Add PostgreSQL addon
railway add postgresql

# Verify database is created
railway variables | grep -i postgres
```

### 2.2 Add Redis

```bash
# Add Redis addon
railway add redis

# Verify Redis is created
railway variables | grep -i redis
```

### 2.3 Verify Database Variables

Expected variables (automatically created):
- `DATABASE_URL`
- `PGDATABASE`
- `PGHOST`
- `PGPASSWORD`
- `PGPORT`
- `PGUSER`
- `REDIS_URL`
- `REDISHOST`
- `REDISPASSWORD`
- `REDISPORT`

## ⚙️ Step 3: Environment Configuration

### 3.1 Backend Environment Variables

```bash
# Set production environment
railway variables set NODE_ENV=production

# Set JWT secret (generate secure key)
railway variables set JWT_SECRET="$(openssl rand -base64 32)"

# Set other backend variables
railway variables set JWT_EXPIRES_IN=24h
railway variables set LOG_LEVEL=info
railway variables set PORT=3001

# Database configuration (if not auto-set)
railway variables set DB_HOST='${{PGHOST}}'
railway variables set DB_PORT='${{PGPORT}}'
railway variables set DB_NAME='${{PGDATABASE}}'
railway variables set DB_USER='${{PGUSER}}'
railway variables set DB_PASSWORD='${{PGPASSWORD}}'

# Redis configuration (if not auto-set)
railway variables set REDIS_HOST='${{REDISHOST}}'
railway variables set REDIS_PORT='${{REDISPORT}}'
railway variables set REDIS_PASSWORD='${{REDISPASSWORD}}'
```

### 3.2 Frontend Environment Variables (Set Later)

We'll set these after backend deployment to get the correct URLs.

## 🎯 Step 4: Deploy Backend Service

### 4.1 Deploy Backend

```bash
# Navigate to backend directory
cd mission-control-backend

# Deploy backend service
railway up --service mission-control-backend

# Monitor deployment
railway logs --service mission-control-backend --follow
```

### 4.2 Verify Backend Deployment

```bash
# Get backend URL
railway status

# Test health endpoint (replace with your URL)
curl https://your-backend-url.railway.app/health

# Check database connection
curl https://your-backend-url.railway.app/ready
```

### 4.3 Run Database Migrations

```bash
# Run Prisma migrations
railway run npx prisma migrate deploy

# Verify migration success
railway run npx prisma db seed
```

**✅ Backend Checkpoint:** Backend should be responding to health checks.

## 🎨 Step 5: Deploy Frontend Service

### 5.1 Set Frontend Environment Variables

```bash
# Navigate to frontend directory
cd ../mission-control-frontend

# Set frontend environment variables (replace with your backend URL)
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set VITE_API_URL="https://your-backend-url.railway.app"
railway variables set VITE_WS_URL="wss://your-backend-url.railway.app"
```

### 5.2 Deploy Frontend

```bash
# Deploy frontend service
railway up --service mission-control-frontend

# Monitor deployment
railway logs --service mission-control-frontend --follow
```

### 5.3 Verify Frontend Deployment

```bash
# Get frontend URL
railway status

# Test frontend (replace with your URL)
curl https://your-frontend-url.railway.app

# Test in browser
open https://your-frontend-url.railway.app
```

**✅ Frontend Checkpoint:** Frontend should load and connect to backend.

## 🔧 Step 6: Update CORS Configuration

### 6.1 Set CORS Origin

```bash
# Navigate back to backend
cd ../mission-control-backend

# Set CORS origin to frontend URL
railway variables set CORS_ORIGIN="https://your-frontend-url.railway.app"

# Redeploy backend with new CORS settings
railway up --service mission-control-backend
```

## 🔗 Step 7: GitHub Integration

### 7.1 Connect GitHub Repository

1. Go to Railway Dashboard
2. Select your project
3. Click "Connect to GitHub"
4. Select your Mission Control repository
5. Choose the main branch

### 7.2 Configure Auto-Deployments

- **Backend**: Deploy from `mission-control-backend/` directory
- **Frontend**: Deploy from `mission-control-frontend/` directory

## 🌐 Step 8: SSL Certificates & Domains

### 8.1 Railway Domains (Automatic SSL)

Railway provides free SSL for `.railway.app` domains automatically.

### 8.2 Custom Domain Setup (Optional)

```bash
# Add custom domain
railway domain add yourdomain.com

# Add subdomain for API
railway domain add api.yourdomain.com
```

**DNS Configuration:**
```
Type: CNAME
Name: @ (for root) or api (for subdomain)
Value: your-service.railway.app
```

### 8.3 Update Environment Variables for Custom Domains

```bash
# Update CORS for custom domain
railway variables set CORS_ORIGIN="https://yourdomain.com"

# Update frontend API URL
railway variables set VITE_API_URL="https://api.yourdomain.com"
railway variables set VITE_WS_URL="wss://api.yourdomain.com"
```

## 📊 Step 9: Production Monitoring

### 9.1 Verify Health Endpoints

Test all health endpoints:

```bash
# Backend health
curl https://your-backend-url.railway.app/health

# Readiness probe
curl https://your-backend-url.railway.app/ready

# Metrics
curl https://your-backend-url.railway.app/metrics
```

### 9.2 Set Up Uptime Monitoring

1. **UptimeRobot** (Free): Monitor your URLs
2. **Railway Alerts**: Configure in dashboard
3. **Custom Alerts**: Use the monitoring setup from `PRODUCTION_MONITORING_SETUP.md`

### 9.3 Error Tracking (Optional)

```bash
# Add Sentry for error tracking
railway variables set SENTRY_DSN="your-sentry-dsn"
railway variables set VITE_SENTRY_DSN="your-sentry-dsn"
```

## 🎉 Step 10: Final Verification

### 10.1 Complete Functionality Test

Test these features:

- [ ] Frontend loads successfully
- [ ] User can log in/register
- [ ] API endpoints respond
- [ ] WebSocket connections work
- [ ] Database operations work
- [ ] Cache (Redis) functioning
- [ ] File uploads work (if applicable)
- [ ] Real-time features work

### 10.2 Performance Test

```bash
# Load test (optional)
npx artillery quick --count 10 --num 100 https://your-backend-url.railway.app/health
```

### 10.3 Security Verification

- [ ] HTTPS enforced
- [ ] CORS properly configured
- [ ] No secrets in environment variables
- [ ] Database credentials secure
- [ ] JWT secret is strong

## 📝 Deployment Summary

### 🎯 Your Live URLs

After deployment, you'll have:

**Production URLs:**
- Frontend: `https://mission-control-frontend-production.up.railway.app`
- Backend: `https://mission-control-backend-production.up.railway.app`
- Health Check: `https://mission-control-backend-production.up.railway.app/health`

**Custom Domain (if configured):**
- Frontend: `https://yourdomain.com`
- Backend API: `https://api.yourdomain.com`

### 🔑 Important Information for Drew

**Railway Project Details:**
- Project Name: mission-control
- Services: mission-control-backend, mission-control-frontend
- Databases: PostgreSQL, Redis
- Environment: Production

**Access Information:**
- Railway Dashboard: `https://railway.app/dashboard`
- Logs: `railway logs`
- Variables: `railway variables`
- Database: `railway connect postgresql`

**Maintenance Commands:**
```bash
# View logs
railway logs --service backend
railway logs --service frontend

# Update environment variables
railway variables set KEY=value

# Redeploy
railway up --service backend
railway up --service frontend

# Rollback (if needed)
railway rollback
```

## 🚨 Troubleshooting

### Common Issues & Solutions

#### 1. Build Failures
```bash
# Check build logs
railway logs --deployment DEPLOYMENT_ID

# Force rebuild
railway up --force
```

#### 2. Database Connection Issues
```bash
# Check database status
railway status

# Test database connection
railway run npx prisma db ping

# Re-run migrations
railway run npx prisma migrate deploy
```

#### 3. CORS Errors
```bash
# Update CORS origin
railway variables set CORS_ORIGIN="https://your-frontend-url.railway.app"

# Redeploy backend
railway up --service backend
```

#### 4. Environment Variable Issues
```bash
# List all variables
railway variables

# Check specific variable
railway variables get NODE_ENV

# Update and redeploy
railway variables set NODE_ENV=production
railway up
```

## 🎊 Success! Mission Control is Live!

Congratulations! Your Mission Control application is now live on Railway with:

✅ **Scalable Infrastructure**
- Auto-scaling based on demand
- Managed PostgreSQL database
- Redis cache for performance
- SSL certificates

✅ **Production Features**
- Health monitoring
- Automatic deployments
- Error tracking
- Performance monitoring

✅ **Security**
- HTTPS enforcement
- Secure environment variables
- Database encryption
- CORS protection

**Next Steps:**
1. Share the live URLs with your team
2. Set up monitoring alerts
3. Configure backups
4. Plan scaling strategy
5. Set up staging environment

**Support Resources:**
- Railway Documentation: [docs.railway.app](https://docs.railway.app)
- Railway Discord: [discord.gg/railway](https://discord.gg/railway)
- Mission Control Support: Check the health endpoints and logs

Your Mission Control is ready for production use! 🚀