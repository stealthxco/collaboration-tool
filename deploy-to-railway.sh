#!/bin/bash

# Mission Control - Railway Deployment Script (Minimal Build)

set -e

echo "🚀 Mission Control Railway Deployment (Minimal Build)"
echo "======================================================"

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Please install it first:"
    echo "   npm install -g @railway/cli"
    exit 1
fi

# Check if logged into Railway
if ! railway whoami &> /dev/null; then
    echo "❌ Not logged into Railway. Please login first:"
    echo "   railway login"
    exit 1
fi

echo "✅ Railway CLI found and authenticated"

# Create new Railway project
echo ""
echo "🏗️  Creating new Railway project..."
railway init

# Add PostgreSQL database
echo ""
echo "🗃️  Adding PostgreSQL database..."
railway add postgresql

# Set environment variables for backend
echo ""
echo "⚙️  Setting environment variables..."

# Backend environment variables
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set HOST=0.0.0.0
railway variables set CORS_ORIGIN="*"

# JWT secrets (generate random ones)
JWT_SECRET=$(openssl rand -base64 64 | tr -d "\n")
JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d "\n")

railway variables set JWT_SECRET="$JWT_SECRET"
railway variables set JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET"

echo "✅ Environment variables set"

# Deploy backend
echo ""
echo "🚀 Deploying backend..."
cd mission-control-backend
railway up

echo ""
echo "✅ Mission Control Minimal Build deployed to Railway!"
echo ""
echo "📋 Next Steps:"
echo "   1. Check the deployment status: railway status"
echo "   2. View logs: railway logs"  
echo "   3. Open the application: railway open"
echo "   4. Set up database schema: railway run npm run db:push"
echo "   5. Seed initial data: railway run npm run db:seed"
echo ""
echo "🌐 Your Mission Control API will be available at the Railway-provided URL"
echo "🔍 Health check: [your-url]/health"
echo "📚 API docs: [your-url]/api"