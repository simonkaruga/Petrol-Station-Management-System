#!/bin/bash
export PGPASSWORD=password
psql -U postgres -h localhost -d wakaruku_petrol_db << 'EOF'
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'bookkeeper',
  two_fa_enabled BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (username, email, password_hash, role)
VALUES ('admin', 'admin@wakaruku.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIpKk6n5jO', 'admin');

SELECT '✅ Admin user created successfully!' as status;
SELECT username, role, email FROM users;
EOF
echo ""
echo "✅ Database fixed! You can now login with:"
echo "   Username: admin"
echo "   Password: admin123"
