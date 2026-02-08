const { Client } = require('pg');
require('dotenv').config();

async function setupDatabase() {
  // Connect to postgres database to create our database
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: 'postgres' // Connect to default postgres database
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    // Check if database exists
    const dbName = process.env.DB_NAME || 'wakaruku_petrol_db';
    const checkDb = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (checkDb.rows.length === 0) {
      // Create database
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Database '${dbName}' created successfully`);
    } else {
      console.log(`✅ Database '${dbName}' already exists`);
    }

    await client.end();

    // Now create tables
    await createTables();

  } catch (error) {
    console.error('❌ Database setup error:', error.message);
    process.exit(1);
  }
}

async function createTables() {
  const { pool } = require('./config/database');

  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'bookkeeper' CHECK (role IN ('admin', 'manager', 'bookkeeper', 'attendant')),
        two_fa_enabled BOOLEAN DEFAULT FALSE,
        two_fa_secret VARCHAR(255),
        backup_codes TEXT,
        last_login TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table created');

    // Create products table
    await pool.query(`
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
      )
    `);
    console.log('✅ Products table created');

    // Create shifts table
    await pool.query(`
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
      )
    `);
    console.log('✅ Shifts table created');

    // Create sales table
    await pool.query(`
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
      )
    `);
    console.log('✅ Sales table created');

    // Create credit_customers table
    await pool.query(`
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
      )
    `);
    console.log('✅ Credit customers table created');

    // Create credit_transactions table
    await pool.query(`
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
      )
    `);
    console.log('✅ Credit transactions table created');

    // Create expenses table
    await pool.query(`
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
      )
    `);
    console.log('✅ Expenses table created');

    // Create deliveries table
    await pool.query(`
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
      )
    `);
    console.log('✅ Deliveries table created');

    // Create inventory table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS inventories (
        id SERIAL PRIMARY KEY,
        "productId" INTEGER REFERENCES products(id) UNIQUE,
        quantity DECIMAL(10, 2) DEFAULT 0,
        "lastUpdated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Inventory table created');

    // Create price_history table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS price_histories (
        id SERIAL PRIMARY KEY,
        "productId" INTEGER REFERENCES products(id),
        "oldPrice" DECIMAL(10, 2),
        "newPrice" DECIMAL(10, 2) NOT NULL,
        "changedBy" INTEGER REFERENCES users(user_id),
        "effectiveDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Price history table created');

    // Create activity_logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER REFERENCES users(user_id),
        action VARCHAR(100) NOT NULL,
        "tableAffected" VARCHAR(50),
        "recordId" INTEGER,
        details TEXT,
        "ipAddress" VARCHAR(50),
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Activity logs table created');

    // Create system_backups table
    await pool.query(`
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
      )
    `);
    console.log('✅ System backups table created');

    // Create default admin user if not exists
    const bcrypt = require('bcryptjs');
    const adminPassword = await bcrypt.hash('admin123', 12);
    
    await pool.query(`
      INSERT INTO users (username, email, password_hash, role)
      VALUES ('admin', 'admin@wakaruku.com', $1, 'admin')
      ON CONFLICT (username) DO NOTHING
    `, [adminPassword]);
    console.log('✅ Default admin user created (username: admin, password: admin123)');

    console.log('\n🎉 Database setup completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
    process.exit(1);
  }
}

setupDatabase();
