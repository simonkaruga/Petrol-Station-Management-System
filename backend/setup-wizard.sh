#!/bin/bash

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   Wakaruku Petrol Station Management System - Setup Wizard    ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if PostgreSQL is installed
echo "🔍 Checking PostgreSQL installation..."
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL is not installed!${NC}"
    echo ""
    echo "Please install PostgreSQL first:"
    echo "  - Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib"
    echo "  - macOS: brew install postgresql"
    echo "  - Windows: Download from https://www.postgresql.org/download/"
    exit 1
fi
echo -e "${GREEN}✅ PostgreSQL is installed${NC}"
echo ""

# Check if PostgreSQL is running
echo "🔍 Checking if PostgreSQL is running..."
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  PostgreSQL is not running!${NC}"
    echo ""
    echo "Please start PostgreSQL:"
    echo "  - Ubuntu/Debian: sudo systemctl start postgresql"
    echo "  - macOS: brew services start postgresql"
    echo "  - Windows: Start PostgreSQL service from Services"
    echo ""
    read -p "Press Enter after starting PostgreSQL..."
    
    # Check again
    if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
        echo -e "${RED}❌ PostgreSQL is still not running. Please start it and try again.${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✅ PostgreSQL is running${NC}"
echo ""

# Get database credentials
echo "📝 Database Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if .env exists
if [ -f ".env" ]; then
    echo -e "${YELLOW}Found existing .env file${NC}"
    read -p "Do you want to use existing credentials? (y/n): " use_existing
    
    if [ "$use_existing" = "y" ] || [ "$use_existing" = "Y" ]; then
        echo "Using existing .env configuration..."
    else
        echo ""
        echo "Please enter your PostgreSQL credentials:"
        read -p "PostgreSQL username [postgres]: " db_user
        db_user=${db_user:-postgres}
        
        read -sp "PostgreSQL password: " db_password
        echo ""
        
        read -p "Database name [wakaruku_petrol_db]: " db_name
        db_name=${db_name:-wakaruku_petrol_db}
        
        # Update .env file
        sed -i.bak "s/DB_USER=.*/DB_USER=$db_user/" .env
        sed -i.bak "s/DB_PASSWORD=.*/DB_PASSWORD=$db_password/" .env
        sed -i.bak "s/DB_NAME=.*/DB_NAME=$db_name/" .env
        
        echo -e "${GREEN}✅ .env file updated${NC}"
    fi
else
    echo -e "${RED}❌ .env file not found!${NC}"
    echo "Creating .env file..."
    
    read -p "PostgreSQL username [postgres]: " db_user
    db_user=${db_user:-postgres}
    
    read -sp "PostgreSQL password: " db_password
    echo ""
    
    read -p "Database name [wakaruku_petrol_db]: " db_name
    db_name=${db_name:-wakaruku_petrol_db}
    
    # Create .env file
    cat > .env << EOF
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$db_name
DB_USER=$db_user
DB_PASSWORD=$db_password

# JWT
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=8h
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_EXPIRES_IN=7d

# Backup
BACKUP_PATH=./backups
BACKUP_RETENTION_DAYS=30

# CORS
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
EOF
    
    echo -e "${GREEN}✅ .env file created${NC}"
fi

echo ""
echo "🔍 Testing database connection..."

# Test connection
if PGPASSWORD=$db_password psql -U $db_user -h localhost -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database connection successful${NC}"
else
    echo -e "${RED}❌ Database connection failed!${NC}"
    echo ""
    echo "Common solutions:"
    echo "1. Check if PostgreSQL password is correct"
    echo "2. Reset PostgreSQL password:"
    echo "   sudo -u postgres psql -c \"ALTER USER postgres PASSWORD 'postgres';\""
    echo "3. Update .env file with correct credentials"
    exit 1
fi

echo ""
echo "📦 Installing dependencies..."
if npm install; then
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

echo ""
echo "🗄️  Setting up database..."
if node setup-database.js; then
    echo -e "${GREEN}✅ Database setup completed${NC}"
else
    echo -e "${RED}❌ Database setup failed${NC}"
    exit 1
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    🎉 Setup Complete! 🎉                       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Default Admin Account:"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Change the admin password after first login!${NC}"
echo ""
echo "To start the application:"
echo "  Backend:  npm start"
echo "  Frontend: cd ../frontend && npm start"
echo ""
echo "Access the application at: http://localhost:3000"
echo ""
