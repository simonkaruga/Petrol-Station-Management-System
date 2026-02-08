# Database Migration Instructions

## Critical Fixes Applied

The following critical issues have been fixed:

### 1. ✅ Shift Model - Added Fuel Meter Readings & Service Tracking
- Added fuel meter readings (petrol, diesel, kerosene opening/closing)
- Added car wash count and cash tracking
- Added parking fees tracking
- Added gas cylinder sales (6kg, 13kg)
- Added payment breakdown (cash vs M-Pesa)

### 2. ✅ Credit System - Restructured
- Created `CreditCustomer` model (separate customer entity)
- Updated `CreditTransaction` model (individual transactions)
- Supports credit sales and payments properly

### 3. ✅ Activity Logs - Added Audit Trail
- Created `ActivityLog` model
- Tracks all critical actions with user, timestamp, IP
- Middleware for automatic logging

### 4. ✅ System Backups - Automated
- Created `SystemBackup` model
- Automated daily backups at 3:00 AM
- Keeps last 30 days of backups
- Backup status tracking

---

## How to Apply These Fixes

### Step 1: Run Database Migrations

```bash
cd backend
npx sequelize-cli db:migrate
```

This will apply all the new migrations:
- `20260206200000-update-shift-structure.js` - Adds shift tracking fields
- `20260206200100-create-activity-log.js` - Creates activity logs table
- `20260206200200-restructure-credit-system.js` - Restructures credit system
- `20260206200300-create-system-backup.js` - Creates backup tracking table

### Step 2: Restart Backend Server

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

The server will now:
- Use the updated models
- Initialize the backup scheduler
- Log activities automatically

### Step 3: Test the Changes

#### Test Shift Reports:
```bash
curl -X POST http://localhost:5000/api/shifts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "attendantName": "John Doe",
    "petrolOpening": 1000.50,
    "petrolClosing": 1500.75,
    "dieselOpening": 800.00,
    "dieselClosing": 1200.25,
    "fuelCashCollected": 5000,
    "fuelMpesaCollected": 3000,
    "carWashesCount": 5,
    "carWashCash": 1500,
    "gas6kgSold": 3,
    "gas13kgSold": 2
  }'
```

#### Test Credit Customer:
```bash
# Create customer
curl -X POST http://localhost:5000/api/credit/customers \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Jane Smith",
    "phoneNumber": "0712345678",
    "vehicleRegistration": "KAA 123X",
    "creditLimit": 10000
  }'

# Record credit sale
curl -X POST http://localhost:5000/api/credit/sale \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": 1,
    "fuelType": "petrol",
    "liters": 20,
    "amount": 3000
  }'

# Record payment
curl -X POST http://localhost:5000/api/credit/payment \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": 1,
    "amount": 1500,
    "paymentMethod": "cash"
  }'
```

---

## What's New

### New API Endpoints:

**Credit Management:**
- `GET /api/credit/customers` - List all credit customers
- `GET /api/credit/customers/:id` - Get customer with transaction history
- `POST /api/credit/customers` - Create new customer
- `POST /api/credit/sale` - Record credit sale
- `POST /api/credit/payment` - Record payment
- `GET /api/credit/outstanding` - Get outstanding debts summary
- `DELETE /api/credit/customers/:id` - Delete customer (if no debt)

**Activity Logs (coming soon):**
- `GET /api/logs` - View activity logs (admin only)

**Backups (coming soon):**
- `GET /api/backups` - List all backups (admin only)
- `POST /api/backups/trigger` - Trigger manual backup (admin only)

---

## Database Schema Changes

### Shifts Table - New Fields:
```sql
attendantName VARCHAR(100)
petrolOpening DECIMAL(10,2)
petrolClosing DECIMAL(10,2)
dieselOpening DECIMAL(10,2)
dieselClosing DECIMAL(10,2)
keroseneOpening DECIMAL(10,2)
keroseneClosing DECIMAL(10,2)
fuelCashCollected DECIMAL(10,2)
fuelMpesaCollected DECIMAL(10,2)
carWashesCount INTEGER
carWashCash DECIMAL(10,2)
parkingFeesCollected DECIMAL(10,2)
gas6kgSold INTEGER
gas13kgSold INTEGER
gasCashCollected DECIMAL(10,2)
gasMpesaCollected DECIMAL(10,2)
```

### New Tables:
- `credit_customers` - Customer master data
- `credit_transactions` - Individual credit sales and payments
- `activity_logs` - Audit trail
- `system_backups` - Backup tracking

---

## Rollback (If Needed)

If something goes wrong, you can rollback:

```bash
cd backend
npx sequelize-cli db:migrate:undo
```

To rollback all migrations:
```bash
npx sequelize-cli db:migrate:undo:all
```

---

## Next Steps

1. ✅ Run migrations
2. ✅ Test shift reports with new fields
3. ✅ Test credit management
4. 🔄 Update frontend forms to use new fields
5. 🔄 Add activity log viewer (admin page)
6. 🔄 Add backup status widget to dashboard
7. 🔄 Implement reporting endpoints

---

## Backup Configuration

The backup system is now active! Configure it in your `.env`:

```env
# Backup settings
BACKUP_PATH=/path/to/backups
DB_HOST=localhost
DB_PORT=5432
DB_NAME=wakaruku_petrol_db
DB_USER=postgres
DB_PASSWORD=your_password
```

Backups will run automatically at 3:00 AM daily and keep the last 30 days.

---

## Troubleshooting

### Migration Fails?
- Check database connection
- Ensure you're in the `backend` directory
- Check `config/config.json` has correct database credentials

### Models Not Loading?
- Restart the server
- Check for syntax errors in model files
- Ensure all associations are correct

### Backup Not Working?
- Ensure `pg_dump` is installed and in PATH
- Check database credentials in `.env`
- Verify backup directory exists and is writable

---

**Status:** ✅ All critical fixes implemented and ready to deploy!
