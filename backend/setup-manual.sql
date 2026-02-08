-- Wakaruku Petrol Station Management System
-- Manual Database Setup Script
-- Run this script if the automatic setup fails

-- Create database (run this first, then connect to the database)
-- CREATE DATABASE wakaruku_petrol_db;

-- Connect to the database before running the rest
-- \c wakaruku_petrol_db

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  user_id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'bookkeeper' CHECK (role IN ('admin', 'manager', 'bookkeeper', 'attendant')),
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  phone_number VARCHAR(20),
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

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(20) DEFAULT 'fuel' CHECK (category IN ('fuel', 'lubricant', 'accessory', 'service')),
  unit VARCHAR(20) DEFAULT 'liters' CHECK (unit IN ('liters', 'gallons', 'units', 'hours')),
  sku VARCHAR(50) UNIQUE,
  "reorderLevel" INTEGER DEFAULT 0,
  "isActive" BOOLEAN DEFAULT TRUE,
  "taxRate" DECIMAL(5, 2) DEFAULT 0.16,
  supplier VARCHAR(100),
  "minStockLevel" INTEGER DEFAULT 0,
  "maxStockLevel" INTEGER DEFAULT 999999,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create shifts table
CREATE TABLE IF NOT EXISTS shifts (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER REFERENCES users(user_id),
  "attendantName" VARCHAR(100),
  "startTime" TIMESTAMP NOT NULL,
  "endTime" TIMESTAMP,
  "petrolOpening" DECIMAL(10, 2),
  "petrolClosing" DECIMAL(10, 2),
  "dieselOpening" DECIMAL(10, 2),
  "dieselClosing" DECIMAL(10, 2),
  "keroseneOpening" DECIMAL(10, 2),
  "keroseneClosing" DECIMAL(10, 2),
  "fuelCashCollected" DECIMAL(10, 2) DEFAULT 0,
  "fuelMpesaCollected" DECIMAL(10, 2) DEFAULT 0,
  "carWashesCount" INTEGER DEFAULT 0,
  "carWashCash" DECIMAL(10, 2) DEFAULT 0,
  "parkingFeesCollected" DECIMAL(10, 2) DEFAULT 0,
  "gas6kgSold" INTEGER DEFAULT 0,
  "gas13kgSold" INTEGER DEFAULT 0,
  "gasCashCollected" DECIMAL(10, 2) DEFAULT 0,
  "gasMpesaCollected" DECIMAL(10, 2) DEFAULT 0,
  "openingCash" DECIMAL(10, 2) DEFAULT 0,
  "closingCash" DECIMAL(10, 2),
  "expectedCash" DECIMAL(10, 2),
  "cashDifference" DECIMAL(10, 2),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'cancelled')),
  notes TEXT,
  "totalSales" DECIMAL(10, 2) DEFAULT 0,
  "totalExpenses" DECIMAL(10, 2) DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
  id SERIAL PRIMARY KEY,
  "productId" INTEGER REFERENCES products(id),
  "userId" INTEGER REFERENCES users(user_id),
  "shiftId" INTEGER REFERENCES shifts(id),
  quantity DECIMAL(10, 2) NOT NULL,
  "unitPrice" DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) DEFAULT 0,
  "totalAmount" DECIMAL(10, 2) NOT NULL,
  "paymentMethod" VARCHAR(20) DEFAULT 'cash' CHECK ("paymentMethod" IN ('cash', 'mpesa', 'card', 'credit', 'bank_transfer')),
  "paymentReference" VARCHAR(100),
  "customerName" VARCHAR(100),
  "customerPhone" VARCHAR(20),
  "creditTransactionId" INTEGER,
  notes TEXT,
  "isCompleted" BOOLEAN DEFAULT TRUE,
  "completedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create credit_customers table
CREATE TABLE IF NOT EXISTS credit_customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  "creditLimit" DECIMAL(10, 2) DEFAULT 0,
  "currentBalance" DECIMAL(10, 2) DEFAULT 0,
  "isActive" BOOLEAN DEFAULT TRUE,
  notes TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create credit_transactions table
CREATE TABLE IF NOT EXISTS credit_transactions (
  id SERIAL PRIMARY KEY,
  "customerId" INTEGER REFERENCES credit_customers(id),
  "userId" INTEGER REFERENCES users(user_id),
  type VARCHAR(20) CHECK (type IN ('sale', 'payment', 'adjustment')),
  amount DECIMAL(10, 2) NOT NULL,
  "balanceBefore" DECIMAL(10, 2),
  "balanceAfter" DECIMAL(10, 2),
  "paymentMethod" VARCHAR(20),
  reference VARCHAR(100),
  notes TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER REFERENCES users(user_id),
  "shiftId" INTEGER REFERENCES shifts(id),
  category VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  "receiptNumber" VARCHAR(50),
  "expenseDate" DATE NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create deliveries table
CREATE TABLE IF NOT EXISTS deliveries (
  id SERIAL PRIMARY KEY,
  "productId" INTEGER REFERENCES products(id),
  "userId" INTEGER REFERENCES users(user_id),
  quantity DECIMAL(10, 2) NOT NULL,
  "unitCost" DECIMAL(10, 2) NOT NULL,
  "totalCost" DECIMAL(10, 2) NOT NULL,
  supplier VARCHAR(100),
  "deliveryDate" DATE NOT NULL,
  "invoiceNumber" VARCHAR(50),
  notes TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create inventory table
CREATE TABLE IF NOT EXISTS inventories (
  id SERIAL PRIMARY KEY,
  "productId" INTEGER REFERENCES products(id) UNIQUE,
  quantity DECIMAL(10, 2) DEFAULT 0,
  "lastUpdated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create price_history table
CREATE TABLE IF NOT EXISTS price_histories (
  id SERIAL PRIMARY KEY,
  "productId" INTEGER REFERENCES products(id),
  "oldPrice" DECIMAL(10, 2),
  "newPrice" DECIMAL(10, 2) NOT NULL,
  "changedBy" INTEGER REFERENCES users(user_id),
  "effectiveDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(user_id),
  action VARCHAR(100) NOT NULL,
  table_affected VARCHAR(50),
  record_id INTEGER,
  details TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create system_backups table
CREATE TABLE IF NOT EXISTS system_backups (
  id SERIAL PRIMARY KEY,
  "fileName" VARCHAR(255) NOT NULL,
  "filePath" VARCHAR(500) NOT NULL,
  "fileSize" BIGINT,
  "backupType" VARCHAR(20) DEFAULT 'manual' CHECK ("backupType" IN ('manual', 'automatic', 'scheduled')),
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  "createdBy" INTEGER REFERENCES users(user_id),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create default admin user
-- Password: admin123 (hashed with bcrypt)
INSERT INTO users (username, email, password_hash, role)
VALUES ('admin', 'admin@wakaruku.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIpKk6n5jO', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales("userId");
CREATE INDEX IF NOT EXISTS idx_sales_product_id ON sales("productId");
CREATE INDEX IF NOT EXISTS idx_sales_shift_id ON sales("shiftId");
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales("createdAt");
CREATE INDEX IF NOT EXISTS idx_shifts_user_id ON shifts("userId");
CREATE INDEX IF NOT EXISTS idx_shifts_status ON shifts(status);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

-- Grant permissions (if needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Display success message
SELECT 'Database setup completed successfully!' AS message;
SELECT 'Default admin user created: username=admin, password=admin123' AS admin_info;
SELECT 'IMPORTANT: Change the admin password after first login!' AS warning;
