#!/bin/bash

# 🔧 Mission Control Railway Deployment Fix Script
# This script addresses common Railway deployment issues and ensures proper configuration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════╗"
echo "║           Mission Control Railway Fix           ║"
echo "║              Deployment Script 🔧               ║"
echo "╚══════════════════════════════════════════════════╝"
echo -e "${NC}"

print_status() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Check Railway CLI and login
check_railway_setup() {
    print_status "Checking Railway CLI setup..."
    
    if ! command -v railway &> /dev/null; then
        print_error "Railway CLI not found. Please install: curl -fsSL https://railway.app/install.sh | sh"
    fi
    
    if ! railway whoami &> /dev/null; then
        print_error "Not logged into Railway. Please run: railway login"
    fi
    
    print_success "Railway CLI setup verified"
}

# Fix service configurations
fix_configurations() {
    print_status "Fixing Railway configurations..."
    
    # Ensure proper directory structure
    if [[ ! -d "mission-control-backend" || ! -d "mission-control-frontend" ]]; then
        print_error "Mission Control directories not found. Please run from project root."
    fi
    
    # Verify package.json files exist
    if [[ ! -f "mission-control-backend/package.json" ]]; then
        print_error "Backend package.json not found"
    fi
    
    if [[ ! -f "mission-control-frontend/package.json" ]]; then
        print_error "Frontend package.json not found"
    fi
    
    print_success "Configuration files verified"
}

# Set up Railway project and services
setup_railway_project() {
    print_status "Setting up Railway project..."
    
    # Check if already in a Railway project
    if railway status &> /dev/null; then
        print_success "Railway project already linked"
    else
        print_warning "No Railway project linked. Creating new project..."
        railway new mission-control
        print_success "Railway project created"
    fi
}

# Add required addons
setup_addons() {
    print_status "Setting up database addons..."
    
    # Add PostgreSQL if not exists
    if ! railway variables | grep -q "DATABASE_URL"; then
        print_status "Adding PostgreSQL addon..."
        railway add postgresql
        print_success "PostgreSQL added"
    else
        print_success "PostgreSQL already configured"
    fi
    
    # Add Redis if not exists
    if ! railway variables | grep -q "REDIS_URL"; then
        print_status "Adding Redis addon..."
        railway add redis
        print_success "Redis added"
    else
        print_success "Redis already configured"
    fi
}

# Generate and set environment variables
setup_environment() {
    print_status "Setting up environment variables..."
    
    # Generate JWT secret if not exists
    if ! railway variables | grep -q "JWT_SECRET"; then
        JWT_SECRET=$(openssl rand -base64 32)
        railway variables set JWT_SECRET="$JWT_SECRET"
        print_success "JWT_SECRET generated and set"
    fi
    
    # Set basic backend environment variables
    railway variables set NODE_ENV="production" || true
    railway variables set LOG_LEVEL="info" || true
    railway variables set JWT_EXPIRES_IN="24h" || true
    
    print_success "Environment variables configured"
}

# Deploy backend service
deploy_backend() {
    print_status "Deploying backend service..."
    
    cd mission-control-backend
    
    # Deploy with error handling
    if railway up --service mission-control-backend 2>&1; then
        print_success "Backend deployed successfully"
    else
        print_warning "Backend deployment had issues. Checking logs..."
        railway logs --service mission-control-backend || true
        print_error "Backend deployment failed. Check logs above."
    fi
    
    cd ..
}

# Deploy frontend service
deploy_frontend() {
    print_status "Deploying frontend service..."
    
    # Get backend URL first
    BACKEND_URL=$(railway status --json | jq -r '.services[] | select(.name=="mission-control-backend") | .url' 2>/dev/null || echo "")
    
    if [[ -n "$BACKEND_URL" ]]; then
        print_status "Setting frontend environment variables..."
        railway variables set VITE_API_URL="$BACKEND_URL" --service mission-control-frontend || true
        railway variables set VITE_WS_URL="${BACKEND_URL/https/wss}" --service mission-control-frontend || true
        print_success "Frontend API URLs configured"
    else
        print_warning "Could not determine backend URL. You may need to set VITE_API_URL manually."
    fi
    
    cd mission-control-frontend
    
    # Deploy with error handling
    if railway up --service mission-control-frontend 2>&1; then
        print_success "Frontend deployed successfully"
    else
        print_warning "Frontend deployment had issues. Checking logs..."
        railway logs --service mission-control-frontend || true
        print_error "Frontend deployment failed. Check logs above."
    fi
    
    cd ..
}

# Update CORS configuration
update_cors() {
    print_status "Updating CORS configuration..."
    
    # Get frontend URL
    FRONTEND_URL=$(railway status --json | jq -r '.services[] | select(.name=="mission-control-frontend") | .url' 2>/dev/null || echo "")
    
    if [[ -n "$FRONTEND_URL" ]]; then
        railway variables set CORS_ORIGIN="$FRONTEND_URL" --service mission-control-backend || true
        print_success "CORS origin set to: $FRONTEND_URL"
        
        # Redeploy backend with new CORS settings
        print_status "Redeploying backend with updated CORS..."
        cd mission-control-backend
        railway up --service mission-control-backend 2>/dev/null || true
        cd ..
    else
        print_warning "Could not determine frontend URL. You may need to set CORS_ORIGIN manually."
    fi
}

# Verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
    # Get service URLs
    BACKEND_URL=$(railway status --json | jq -r '.services[] | select(.name=="mission-control-backend") | .url' 2>/dev/null || echo "")
    FRONTEND_URL=$(railway status --json | jq -r '.services[] | select(.name=="mission-control-frontend") | .url' 2>/dev/null || echo "")
    
    if [[ -n "$BACKEND_URL" ]]; then
        print_status "Testing backend health endpoint..."
        if curl -sf "$BACKEND_URL/health" > /dev/null 2>&1; then
            print_success "Backend health check passed"
        else
            print_warning "Backend health check failed or not ready yet"
        fi
    fi
    
    if [[ -n "$FRONTEND_URL" ]]; then
        print_status "Testing frontend..."
        if curl -sf "$FRONTEND_URL" > /dev/null 2>&1; then
            print_success "Frontend is responding"
        else
            print_warning "Frontend not responding or not ready yet"
        fi
    fi
}

# Display final information
show_deployment_info() {
    echo -e "\n${GREEN}🎉 Deployment Fix Complete!${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════${NC}"
    
    # Show service URLs
    print_status "Getting service URLs..."
    railway status || true
    
    echo -e "\n${BLUE}📋 Next Steps:${NC}"
    echo "1. Check service logs: railway logs --service <service-name>"
    echo "2. View Railway dashboard: railway open"
    echo "3. Monitor health endpoints"
    echo "4. Update DNS if using custom domains"
    
    echo -e "\n${BLUE}🔧 Useful Commands:${NC}"
    echo "- View logs: railway logs"
    echo "- Check status: railway status"
    echo "- List variables: railway variables"
    echo "- Redeploy: railway up"
    
    print_success "Mission Control Railway deployment fix completed!"
}

# Main execution
main() {
    check_railway_setup
    fix_configurations
    setup_railway_project
    setup_addons
    setup_environment
    deploy_backend
    deploy_frontend
    update_cors
    verify_deployment
    show_deployment_info
}

# Run the script
main "$@"