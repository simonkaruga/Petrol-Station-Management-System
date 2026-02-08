#!/bin/bash

echo "🚀 Starting Wakaruku Petrol Station Management System..."
echo ""

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "❌ PostgreSQL is not running!"
    echo "Please start PostgreSQL first:"
    echo "  - Ubuntu/Debian: sudo systemctl start postgresql"
    echo "  - macOS: brew services start postgresql"
    echo "  - Windows: Start PostgreSQL service from Services"
    exit 1
fi

echo "✅ PostgreSQL is running"
echo ""

# Setup database
echo "📦 Setting up database..."
node setup-database.js

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Database setup completed!"
    echo ""
    echo "🌐 Starting server..."
    npm start
else
    echo ""
    echo "❌ Database setup failed!"
    exit 1
fi
