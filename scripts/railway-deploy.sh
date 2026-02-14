#!/bin/bash

# Mission Control Railway Deployment Script
# This script deploys Mission Control to Railway with all required services

echo "🚂 Mission Control Railway Deployment"
echo "====================================="

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    curl -fsSL https://railway.app/install.sh | sh
fi

echo "✅ Railway CLI found: $(railway --version)"

# Login to Railway (this will open browser for authentication)
echo "🔐 Authenticating with Railway..."
echo "   This will open your browser for login."
railway login

# Create new Railway project
echo "🏗️  Creating Railway project..."
railway project new mission-control

# Add PostgreSQL database
echo "🗄️  Adding PostgreSQL database..."
railway plugin add postgresql

# Add Redis cache
echo "🔴 Adding Redis cache..."
railway plugin add redis

# Set up environment variables for backend
echo "⚙️  Setting up backend environment..."
railway environment add production

# Deploy backend service
echo "🚀 Deploying backend service..."
railway service new backend
railway up --service backend

# Deploy frontend service  
echo "🌐 Deploying frontend service..."
railway service new frontend
railway up --service frontend

# Get deployment URLs
echo "📡 Getting deployment URLs..."
BACKEND_URL=$(railway service --service backend domain)
FRONTEND_URL=$(railway service --service frontend domain)

echo ""
echo "🎉 Deployment Complete!"
echo "======================"
echo "Frontend URL: https://$FRONTEND_URL"
echo "Backend URL:  https://$BACKEND_URL"
echo ""
echo "🔧 Next steps:"
echo "1. Visit the frontend URL to access Mission Control"
echo "2. Use admin credentials to login (check backend logs for initial setup)"
echo "3. Configure Slack integration if needed"
echo ""
echo "📊 To monitor deployment:"
echo "railway logs --service backend"
echo "railway logs --service frontend"