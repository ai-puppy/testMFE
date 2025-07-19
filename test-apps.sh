#!/bin/bash

echo "Testing Micro Frontend Applications..."
echo "===================================="

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed. Please install Node.js and npm first."
    exit 1
fi

# Check store-app
echo -e "\n1. Checking store-app..."
if [ -d "store-app" ] && [ -f "store-app/package.json" ]; then
    echo "✅ store-app directory exists"
    cd store-app
    if [ -d "node_modules" ]; then
        echo "✅ Dependencies installed"
    else
        echo "❌ Dependencies not installed. Run: cd store-app && npm install"
    fi
    cd ..
else
    echo "❌ store-app not found"
fi

# Check inventory-app
echo -e "\n2. Checking inventory-app..."
if [ -d "inventory-app" ] && [ -f "inventory-app/package.json" ]; then
    echo "✅ inventory-app directory exists"
    cd inventory-app
    if [ -d "node_modules" ]; then
        echo "✅ Dependencies installed"
    else
        echo "❌ Dependencies not installed. Run: cd inventory-app && npm install"
    fi
    cd ..
else
    echo "❌ inventory-app not found"
fi

echo -e "\n===================================="
echo "To run the applications:"
echo "1. In one terminal: cd store-app && npm start"
echo "2. In another terminal: cd inventory-app && npm start"
echo "Or use: ./run-apps.sh"
echo "===================================="