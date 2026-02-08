# Wakaruku Petrol Station Management System - Setup Guide

## Quick Start

### Prerequisites
1. **PostgreSQL** (version 12 or higher)
2. **Node.js** (version 14 or higher)
3. **npm** (comes with Node.js)

### Step 1: PostgreSQL Setup

#### Option A: Fresh PostgreSQL Installation
If you just installed PostgreSQL, the default password might be empty or "postgres".

#### Option B: Reset PostgreSQL Password (if you forgot it)

**On Linux (Ubuntu/Debian):**
```bash
# Switch to postgres user
sudo -u postgres psql

# Inside psql, run:
ALTER USER postgres PASSWORD 'postgres';
\q
```

**On macOS:**
```bash
# Start PostgreSQL
brew services start postgresql

# Connect to PostgreSQL
psql postgres

# Inside psql, run:
ALTER USER postgres PASSWORD 'postgres';
\q
```

**On Windows:**
1. Open pgAdmin or SQL Shell (psql)
2. Connect as postgres user
3. Run: `ALTER USER postgres PASSWORD 'postgres';`

#### Option C: Use Your Existing Password
Edit the `.env` file and update `DB_PASSWORD` with your actual PostgreSQL password.

### Step 2: Verify PostgreSQL is Running

**Linux:**
```bash
sudo systemctl status postgresql
# If not running:
sudo systemctl start postgresql
```

**macOS:**
```bash
brew services list
# If not running:
brew services start postgresql
```

**Windows:**
- Open Services (services.msc)
- Find "PostgreSQL" service
- Start it if not running

### Step 3: Test Database Connection

```bash
# Test if you can connect to PostgreSQL
psql -U postgres -h localhost -c "SELECT version();"
```

If this works, you're ready to proceed!

### Step 4: Install Dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### Step 5: Configure Environment Variables

**Backend (.env):**
```env
# Server
PORT=5000
NODE_ENV=development

# Database - UPDATE THESE WITH YOUR CREDENTIALS
DB_HOST=localhost
DB_PORT=5432
DB_NAME=wakaruku_petrol_db
DB_USER=postgres
DB_PASSWORD=your_actual_password_here

# JWT
JWT_SECRET=change_this_to_a_random_secret_key_at_least_32_chars_long
JWT_EXPIRES_IN=8h
JWT_REFRESH_SECRET=change_this_to_another_random_secret_key_at_least_32_chars
JWT_REFRESH_EXPIRES_IN=7d

# Backup
BACKUP_PATH=./backups
BACKUP_RETENTION_DAYS=30

# CORS
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:5000
```

### Step 6: Setup Database

```bash
cd backend
npm run setup
```

This will:
- Create the database `wakaruku_petrol_db`
- Create all required tables
- Create a default admin user:
  - Username: `admin`
  - Password: `admin123`
  - **⚠️ CHANGE THIS PASSWORD IMMEDIATELY AFTER FIRST LOGIN!**

### Step 7: Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm start
# or for development with auto-reload:
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

### Step 8: Access the Application

1. Open your browser and go to: `http://localhost:3000`
2. Login with:
   - Username: `admin`
   - Password: `admin123`
3. **IMPORTANT:** Change the admin password immediately!

## Troubleshooting

### Issue 1: "password authentication failed for user postgres"

**Solution:**
1. Reset PostgreSQL password (see Step 1, Option B above)
2. Update `.env` file with correct password
3. Run `npm run setup` again

### Issue 2: "database does not exist"

**Solution:**
The setup script should create it automatically. If it fails:
```bash
# Manually create database
psql -U postgres -h localhost -c "CREATE DATABASE wakaruku_petrol_db;"

# Then run setup again
npm run setup
```

### Issue 3: "ECONNREFUSED" or "Connection refused"

**Solution:**
PostgreSQL is not running. Start it:
- Linux: `sudo systemctl start postgresql`
- macOS: `brew services start postgresql`
- Windows: Start PostgreSQL service from Services

### Issue 4: Port 5000 or 3000 already in use

**Solution:**
Change the port in `.env` files:
- Backend: Change `PORT=5000` to another port (e.g., `PORT=5001`)
- Frontend: Change `VITE_API_URL` to match backend port

### Issue 5: Frontend can't connect to backend

**Solution:**
1. Make sure backend is running
2. Check `VITE_API_URL` in frontend `.env` matches backend URL
3. Check CORS settings in backend `.env`

## Default User Accounts

After setup, you'll have one admin account:
- **Username:** admin
- **Password:** admin123
- **Role:** admin

**⚠️ Security Warning:** Change this password immediately after first login!

## Database Schema

The system includes these tables:
- `users` - User accounts and authentication
- `products` - Products (fuel, lubricants, etc.)
- `sales` - Sales transactions
- `shifts` - Shift management
- `credit_customers` - Credit customers
- `credit_transactions` - Credit sales and payments
- `expenses` - Business expenses
- `deliveries` - Product deliveries
- `inventories` - Inventory tracking
- `price_histories` - Price change history
- `activity_logs` - System activity logs
- `system_backups` - Backup records

## Features

1. **User Management**
   - Role-based access control (Admin, Manager, Bookkeeper, Attendant)
   - Two-factor authentication (2FA)
   - Password security with complexity requirements

2. **Sales Management**
   - Record fuel and product sales
   - Multiple payment methods (Cash, M-Pesa, Card, Credit)
   - Shift-based tracking

3. **Inventory Management**
   - Track product quantities
   - Low stock alerts
   - Delivery tracking

4. **Credit Management**
   - Customer credit accounts
   - Credit sales and payments
   - Balance tracking

5. **Reporting**
   - Daily, weekly, monthly reports
   - Shift reports
   - Financial summaries

6. **Security**
   - JWT-based authentication
   - Rate limiting
   - Activity logging
   - Automatic backups

## Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Verify all prerequisites are installed
3. Check that PostgreSQL is running
4. Verify environment variables are correct
5. Check console logs for error messages

## Next Steps

1. ✅ Complete the setup
2. ✅ Login with admin account
3. ✅ Change admin password
4. ✅ Create additional user accounts
5. ✅ Add products to inventory
6. ✅ Configure system settings
7. ✅ Start recording sales!

---

**Version:** 1.0.0  
**Last Updated:** 2024
