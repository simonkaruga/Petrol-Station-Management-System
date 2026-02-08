# 🚀 GET STARTED IN 3 MINUTES!

## The Fastest Way to Get Your System Running

### Step 1: Make Sure PostgreSQL is Running

**Linux:**
```bash
sudo systemctl start postgresql
```

**macOS:**
```bash
brew services start postgresql
```

**Windows:**
- Open Services (Win+R, type `services.msc`)
- Find "PostgreSQL" and click "Start"

### Step 2: Run the Quick Start Script

```bash
cd Wakaruku-Petrol-Station-Management-System
./quick-start.sh
```

Choose option **1** (Complete setup) and follow the prompts.

### Step 3: Access Your Application

Open your browser and go to:
```
http://localhost:3000
```

Login with:
- **Username:** admin
- **Password:** admin123

**⚠️ Change this password immediately after login!**

---

## That's It! 🎉

Your petrol station management system is now running!

---

## Need Help?

### PostgreSQL Password Issues?

If you get "password authentication failed":

```bash
# Reset PostgreSQL password
sudo -u postgres psql
ALTER USER postgres PASSWORD 'postgres';
\q

# Then update backend/.env
# Change DB_PASSWORD=postgres
```

### Port Already in Use?

```bash
# Find what's using port 5000
lsof -i :5000

# Kill it or change port in backend/.env
```

### Still Having Issues?

1. Read `SETUP_GUIDE.md` for detailed instructions
2. Check `FIXES_APPLIED.md` for troubleshooting
3. Run `cd backend && ./test-setup.sh` for diagnostics

---

## What You Get

✅ **User Management** - Multiple roles, 2FA support  
✅ **Sales Tracking** - Record all sales with multiple payment methods  
✅ **Inventory Management** - Track stock levels and deliveries  
✅ **Credit Management** - Manage customer credit accounts  
✅ **Shift Management** - Track attendant shifts and cash  
✅ **Reports** - Daily, weekly, monthly financial reports  
✅ **Security** - JWT auth, rate limiting, activity logs  

---

## Quick Commands

```bash
# Start backend
cd backend && npm start

# Start frontend
cd frontend && npm start

# Setup database
cd backend && npm run setup

# Run tests
cd backend && npm test
```

---

## Default Accounts

After setup, you have one admin account:
- Username: `admin`
- Password: `admin123`

**Create more users from the Settings page after logging in!**

---

**Need more details?** Check out:
- `README.md` - Full documentation
- `SETUP_GUIDE.md` - Detailed setup guide
- `FIXES_APPLIED.md` - Technical details

**Happy managing! 🎊**
