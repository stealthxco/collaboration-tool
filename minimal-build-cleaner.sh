#!/bin/bash

# Mission Control Minimal Build Cleaner
# Comments out Redis and WebSocket dependencies for Railway deployment

echo "🛠️ Creating minimal build for Mission Control..."

# Function to comment out Redis/WebSocket imports and calls
clean_route_file() {
    local file=$1
    echo "Cleaning $file..."
    
    # Comment out imports
    sed -i.backup 's/^import RedisService/\/\/ import RedisService \/\/ MINIMAL BUILD: Disabled Redis/g' "$file"
    sed -i '' 's/^import WebSocketService/\/\/ import WebSocketService \/\/ MINIMAL BUILD: Disabled WebSocket/g' "$file"
    
    # Comment out service instances
    sed -i '' 's/const redis = RedisService.getInstance();/\/\/ const redis = RedisService.getInstance(); \/\/ MINIMAL BUILD: Disabled Redis/g' "$file"
    sed -i '' 's/const ws = WebSocketService.getInstance();/\/\/ const ws = WebSocketService.getInstance(); \/\/ MINIMAL BUILD: Disabled WebSocket/g' "$file"
    
    # Comment out Redis cache calls
    sed -i '' 's/await redis\.get/\/\/ await redis\.get \/\/ MINIMAL BUILD: Cache disabled/g' "$file"
    sed -i '' 's/await redis\.set/\/\/ await redis\.set \/\/ MINIMAL BUILD: Cache disabled/g' "$file"
    sed -i '' 's/await redis\.del/\/\/ await redis\.del \/\/ MINIMAL BUILD: Cache disabled/g' "$file"
    
    # Comment out WebSocket broadcast calls
    sed -i '' 's/ws\.broadcast/\/\/ ws\.broadcast \/\/ MINIMAL BUILD: WebSocket disabled/g' "$file"
    
    echo "✅ Cleaned $file"
}

# Clean route files
for route_file in collaboration-tool/mission-control-backend/src/routes/{agents,missions,comments}.ts; do
    if [ -f "$route_file" ]; then
        clean_route_file "$route_file"
    fi
done

echo "🚀 Minimal build cleaning complete!"
echo "📝 Note: Cache functionality has been disabled - the app will work but may be slower"
echo "📝 Note: WebSocket real-time features have been disabled"