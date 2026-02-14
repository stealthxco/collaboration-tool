#!/bin/bash

# Fix cache logic by commenting out cache-dependent conditionals

echo "🔧 Fixing cache-dependent logic..."

# Function to comment out cache conditional blocks
fix_cache_logic() {
    local file=$1
    echo "Fixing cache logic in $file..."
    
    # Comment out cache conditionals like "if (cached) { return reply.send(cached); }"
    sed -i.backup2 '
        /if (cached) {/,/}/ {
            s/^/      \/\/ /
            s/$/  \/\/ MINIMAL BUILD: Cache disabled/
        }
    ' "$file"
    
    # Also handle variations
    sed -i '' '
        /if (cache.*) {/,/}/ {
            s/^/      \/\/ /
            s/$/  \/\/ MINIMAL BUILD: Cache disabled/
        }
    ' "$file"
    
    # Comment out cache key lines
    sed -i '' 's/const cacheKey =/\/\/ const cacheKey = \/\/ MINIMAL BUILD: Cache disabled;/g' "$file"
    
    echo "✅ Fixed cache logic in $file"
}

# Fix cache logic in route files
for route_file in collaboration-tool/mission-control-backend/src/routes/{agents,missions,comments}.ts; do
    if [ -f "$route_file" ]; then
        fix_cache_logic "$route_file"
    fi
done

echo "🚀 Cache logic fixing complete!"