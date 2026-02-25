#!/bin/bash

# VideoDanza NFT - Development Startup Script

echo "🎬 VideoDanza NFT - Starting Development Environment"
echo "=================================================="
echo ""

# Check if running from correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run from project root."
    exit 1
fi

# Install dependencies if needed
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

if [ ! -d "smart-contracts/node_modules" ]; then
    echo "📦 Installing smart contract dependencies..."
    cd smart-contracts
    npm install
    cd ..
fi

echo ""
echo "✅ All dependencies ready"
echo ""
echo "Starting servers..."
echo "=================================================="
echo ""

# Start backend (if needed)
# (Backend setup would go here)

# Start frontend
cd frontend
echo "🚀 Starting frontend on http://localhost:3000"
npm run dev
