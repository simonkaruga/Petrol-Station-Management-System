#!/bin/bash

echo "🚀 Wakaruku Petrol Station - Quick Start Script"
echo "================================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the frontend directory"
    echo "Usage: cd frontend && ./START_APP.sh"
    exit 1
fi

echo "✅ Step 1: Installing missing dependencies..."
npm install date-fns react-icons react-hot-toast

echo "✅ Step 2: Checking if backend is running..."
# Check if backend port 5000 is in use
if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ Backend is running on port 5000"
else
    echo "⚠️  Backend is not running. Please start it with:"
    echo "   cd ../backend && npm run dev"
    echo "   (Keep this terminal open)"
fi

echo "✅ Step 3: Starting frontend development server..."
echo "   Frontend will run on: http://localhost:3002"
echo "   (Press Ctrl+C to stop)"
echo ""

# Start the frontend server
npm run dev