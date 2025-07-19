#!/bin/bash

echo "Starting Micro Frontend Applications..."
echo "===================================="

# Store the base directory
BASE_DIR=$(pwd)

# Function to cleanup on exit
cleanup() {
    echo -e "\n\nStopping all applications..."
    kill $(jobs -p) 2>/dev/null
    exit
}

# Set up trap to cleanup on script exit
trap cleanup EXIT INT TERM

# Start store-app
echo "Starting Store App on http://localhost:3000"
cd "$BASE_DIR/store-app" && npm start &
STORE_PID=$!

# Wait a bit for the first app to start
sleep 5

# Start inventory-app
echo "Starting Inventory App on http://localhost:3001"
cd "$BASE_DIR/inventory-app" && npm start &
INVENTORY_PID=$!

echo -e "\n===================================="
echo "Both applications are starting up..."
echo "Store App: http://localhost:3000"
echo "Inventory App: http://localhost:3001"
echo -e "====================================\n"
echo "Press Ctrl+C to stop all applications"

# Wait for both processes
wait $STORE_PID $INVENTORY_PID