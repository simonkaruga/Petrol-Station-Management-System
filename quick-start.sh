#!/bin/bash

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║        Wakaruku Petrol Station - Quick Start Script           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

echo -e "${BLUE}📍 Project Directory: $SCRIPT_DIR${NC}"
echo ""

# Check if backend directory exists
if [ ! -d "$BACKEND_DIR" ]; then
    echo -e "${RED}❌ Backend directory not found!${NC}"
    exit 1
fi

# Check if frontend directory exists
if [ ! -d "$FRONTEND_DIR" ]; then
    echo -e "${RED}❌ Frontend directory not found!${NC}"
    exit 1
fi

echo "🔍 Checking prerequisites..."
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed!${NC}"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node --version)${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm $(npm --version)${NC}"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL is not installed!${NC}"
    echo "Please install PostgreSQL first"
    exit 1
fi
echo -e "${GREEN}✅ PostgreSQL installed${NC}"

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  PostgreSQL is not running!${NC}"
    echo ""
    echo "Please start PostgreSQL:"
    echo "  - Linux: sudo systemctl start postgresql"
    echo "  - macOS: brew services start postgresql"
    echo ""
    read -p "Press Enter after starting PostgreSQL..."
    
    if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
        echo -e "${RED}❌ PostgreSQL is still not running${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✅ PostgreSQL is running${NC}"
echo ""

# Ask user what they want to do
echo "What would you like to do?"
echo "1) Complete setup (first time)"
echo "2) Start backend only"
echo "3) Start frontend only"
echo "4) Start both backend and frontend"
echo "5) Run tests"
echo "6) Exit"
echo ""
read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        echo ""
        echo "🚀 Running complete setup..."
        echo ""
        
        # Backend setup
        echo "📦 Setting up backend..."
        cd "$BACKEND_DIR"
        
        if [ ! -d "node_modules" ]; then
            echo "Installing backend dependencies..."
            npm install
        fi
        
        echo ""
        echo "🗄️  Setting up database..."
        if [ -f "setup-wizard.sh" ]; then
            ./setup-wizard.sh
        else
            npm run setup
        fi
        
        # Frontend setup
        echo ""
        echo "📦 Setting up frontend..."
        cd "$FRONTEND_DIR"
        
        if [ ! -d "node_modules" ]; then
            echo "Installing frontend dependencies..."
            npm install
        fi
        
        echo ""
        echo -e "${GREEN}✅ Setup complete!${NC}"
        echo ""
        echo "To start the application:"
        echo "  Backend:  cd backend && npm start"
        echo "  Frontend: cd frontend && npm start"
        ;;
        
    2)
        echo ""
        echo "🚀 Starting backend..."
        cd "$BACKEND_DIR"
        
        if [ ! -d "node_modules" ]; then
            echo "Installing dependencies..."
            npm install
        fi
        
        npm start
        ;;
        
    3)
        echo ""
        echo "🚀 Starting frontend..."
        cd "$FRONTEND_DIR"
        
        if [ ! -d "node_modules" ]; then
            echo "Installing dependencies..."
            npm install
        fi
        
        npm start
        ;;
        
    4)
        echo ""
        echo "🚀 Starting both backend and frontend..."
        echo ""
        
        # Start backend in background
        cd "$BACKEND_DIR"
        if [ ! -d "node_modules" ]; then
            echo "Installing backend dependencies..."
            npm install
        fi
        echo "Starting backend..."
        npm start &
        BACKEND_PID=$!
        
        # Wait a bit for backend to start
        sleep 3
        
        # Start frontend
        cd "$FRONTEND_DIR"
        if [ ! -d "node_modules" ]; then
            echo "Installing frontend dependencies..."
            npm install
        fi
        echo "Starting frontend..."
        npm start
        
        # Kill backend when frontend stops
        kill $BACKEND_PID 2>/dev/null
        ;;
        
    5)
        echo ""
        echo "🧪 Running tests..."
        cd "$BACKEND_DIR"
        npm test
        ;;
        
    6)
        echo "Goodbye!"
        exit 0
        ;;
        
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac
