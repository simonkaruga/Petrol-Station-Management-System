#!/bin/bash

echo "🧪 Testing Wakaruku System Setup..."
echo ""

# Check Node.js
echo "1. Checking Node.js..."
if command -v node &> /dev/null; then
    echo "   ✅ Node.js $(node --version)"
else
    echo "   ❌ Node.js not found"
    exit 1
fi

# Check npm
echo "2. Checking npm..."
if command -v npm &> /dev/null; then
    echo "   ✅ npm $(npm --version)"
else
    echo "   ❌ npm not found"
    exit 1
fi

# Check PostgreSQL
echo "3. Checking PostgreSQL..."
if command -v psql &> /dev/null; then
    echo "   ✅ PostgreSQL installed"
else
    echo "   ❌ PostgreSQL not found"
    exit 1
fi

# Check if PostgreSQL is running
echo "4. Checking PostgreSQL service..."
if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "   ✅ PostgreSQL is running"
else
    echo "   ❌ PostgreSQL is not running"
    echo "   Start it with: sudo systemctl start postgresql (Linux) or brew services start postgresql (macOS)"
    exit 1
fi

# Check .env file
echo "5. Checking .env file..."
if [ -f ".env" ]; then
    echo "   ✅ .env file exists"
else
    echo "   ❌ .env file not found"
    exit 1
fi

# Check node_modules
echo "6. Checking dependencies..."
if [ -d "node_modules" ]; then
    echo "   ✅ Dependencies installed"
else
    echo "   ⚠️  Dependencies not installed"
    echo "   Run: npm install"
fi

echo ""
echo "✅ All checks passed!"
echo ""
echo "Next steps:"
echo "1. Run: npm run setup (to create database)"
echo "2. Run: npm start (to start backend)"
echo "3. In another terminal: cd ../frontend && npm start"
echo ""
