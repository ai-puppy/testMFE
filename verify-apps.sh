#!/bin/bash

echo "Verifying Micro Frontend Applications..."
echo "========================================"

# Check Store App
echo -e "\nChecking Store App (http://localhost:3000)..."
STORE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$STORE_RESPONSE" = "200" ]; then
    echo "✅ Store App is running"
    STORE_TITLE=$(curl -s http://localhost:3000 | grep -o '<title>.*</title>' | sed 's/<[^>]*>//g')
    echo "   Title: $STORE_TITLE"
else
    echo "❌ Store App is not responding (HTTP $STORE_RESPONSE)"
fi

# Check Inventory App
echo -e "\nChecking Inventory App (http://localhost:3001)..."
INVENTORY_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001)
if [ "$INVENTORY_RESPONSE" = "200" ]; then
    echo "✅ Inventory App is running"
    INVENTORY_TITLE=$(curl -s http://localhost:3001 | grep -o '<title>.*</title>' | sed 's/<[^>]*>//g')
    echo "   Title: $INVENTORY_TITLE"
else
    echo "❌ Inventory App is not responding (HTTP $INVENTORY_RESPONSE)"
fi

# Check Module Federation remoteEntry files
echo -e "\nChecking Module Federation setup..."
STORE_REMOTE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/remoteEntry.js)
if [ "$STORE_REMOTE" = "200" ]; then
    echo "✅ Store remoteEntry.js is accessible"
else
    echo "❌ Store remoteEntry.js is not accessible"
fi

INVENTORY_REMOTE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/remoteEntry.js)
if [ "$INVENTORY_REMOTE" = "200" ]; then
    echo "✅ Inventory remoteEntry.js is accessible"
else
    echo "❌ Inventory remoteEntry.js is not accessible"
fi

echo -e "\n========================================"
echo "If all checks pass, open:"
echo "- Store App: http://localhost:3000"
echo "- Inventory App: http://localhost:3001"
echo "========================================"