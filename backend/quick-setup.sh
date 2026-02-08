#!/bin/bash

echo "🔧 Quick Database Setup"
echo ""

# Try common PostgreSQL passwords
PASSWORDS=("postgres" "" "admin" "password")

for PASS in "${PASSWORDS[@]}"; do
    echo "Trying password: ${PASS:-<empty>}"
    if PGPASSWORD="$PASS" psql -U postgres -h localhost -c "SELECT 1;" > /dev/null 2>&1; then
        echo "✅ Connected with password: ${PASS:-<empty>}"
        
        # Create database
        echo "Creating database..."
        PGPASSWORD="$PASS" psql -U postgres -h localhost -c "CREATE DATABASE wakaruku_petrol_db;" 2>/dev/null
        
        # Create tables and admin user
        echo "Setting up tables..."
        PGPASSWORD="$PASS" psql -U postgres -h localhost -d wakaruku_petrol_db << 'EOF'
CREATE TABLE IF NOT EXISTS users (
  user_id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'bookkeeper',
  two_fa_enabled BOOLEAN DEFAULT FALSE,
  two_fa_secret VARCHAR(255),
  backup_codes TEXT,
  last_login TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  failed_login_attempts INTEGER DEFAULT 0,
  account_locked_until TIMESTAMP,
  password_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  token_version INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (username, email, password_hash, role)
VALUES ('admin', 'admin@wakaruku.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIpKk6n5jO', 'admin')
ON CONFLICT (username) DO NOTHING;

SELECT 'Admin user created: username=admin, password=admin123' AS result;
EOF
        
        echo ""
        echo "✅ Setup complete!"
        echo "Username: admin"
        echo "Password: admin123"
        exit 0
    fi
done

echo ""
echo "❌ Could not connect to PostgreSQL"
echo ""
echo "Please reset your PostgreSQL password:"
echo "  sudo -u postgres psql"
echo "  ALTER USER postgres PASSWORD 'postgres';"
echo "  \\q"
