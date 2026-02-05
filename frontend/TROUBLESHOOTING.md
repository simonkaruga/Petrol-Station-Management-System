# Wakaruku Petrol Station Frontend - Troubleshooting Guide

## 🚨 Common Issues & Solutions

### 1. White Screen on http://localhost:3001/

**Problem:** Browser shows a blank white screen when accessing the application.

**Solutions:**

#### A. Check if the development server is running
```bash
# In your terminal, navigate to the frontend directory
cd frontend

# Start the development server
npm run dev

# You should see output like:
# VITE v5.0.0  ready in 123 ms
# ➜  Local:   http://localhost:3001/
# ➜  Network: http://192.168.1.100:3001/
```

#### B. Check browser console for errors
1. Open your browser's Developer Tools (F12)
2. Go to the "Console" tab
3. Look for any error messages
4. Common errors and fixes:

**Error: "Failed to load resource: the server responded with a status of 404"**
- Make sure you're accessing the correct URL: `http://localhost:3001/`
- Check that the server is running on port 3001 (not 3000)

**Error: "Cannot read properties of undefined"**
- This usually means a component is trying to access data that doesn't exist
- Check if the backend API is running on port 5000
- Verify the API endpoints are working

**Error: "Module not found"**
- Missing dependencies
- Run: `npm install` to install missing packages

#### C. Check network tab
1. In Developer Tools, go to "Network" tab
2. Refresh the page
3. Look for failed requests (red entries)
4. Check if requests to the backend API are working

### 2. Application Won't Start

**Problem:** `npm run dev` fails or doesn't start properly.

**Solutions:**

#### A. Missing dependencies
```bash
# Install all dependencies
npm install

# If you get permission errors on Mac/Linux:
sudo npm install

# Or fix npm permissions:
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
```

#### B. Port already in use
```bash
# Check what's using port 3001
# Windows:
netstat -ano | findstr :3001
# Mac/Linux:
lsof -i :3001

# Kill the process using the port
# Windows (replace PID with actual process ID):
taskkill /PID [PID] /F
# Mac/Linux:
kill -9 [PID]
```

#### C. Node.js version issues
```bash
# Check Node.js version
node --version

# You need Node.js v18 or higher
# Download from: https://nodejs.org/
```

### 3. Backend API Connection Issues

**Problem:** Frontend can't connect to the backend API.

**Solutions:**

#### A. Check if backend is running
```bash
# In a separate terminal, navigate to backend directory
cd backend

# Start the backend server
npm run dev

# You should see:
# 🚀 Wakaruku Petrol Station API running on port 5000
```

#### B. Check API endpoints
```bash
# Test if backend is responding
curl http://localhost:5000/health

# Should return: {"status":"ok","timestamp":"..."}
```

#### C. CORS issues
If you see CORS errors in the console:
- The backend should have CORS enabled (check backend/cors.js)
- Make sure the frontend URL matches what's allowed in backend

### 4. Authentication Issues

**Problem:** Can't log in or authentication fails.

**Solutions:**

#### A. Default credentials
- Username: `admin`
- Password: `Admin@123`

#### B. Check if user exists in database
```bash
# Connect to PostgreSQL and check users table
psql -U postgres -d wakaruku_petrol_db
SELECT * FROM users;
```

#### C. JWT token issues
- Clear browser cookies and local storage
- Try incognito/private browsing mode
- Check if JWT_SECRET in backend matches what's expected

### 5. Database Connection Issues

**Problem:** Backend can't connect to PostgreSQL.

**Solutions:**

#### A. Check PostgreSQL is running
```bash
# Check if PostgreSQL service is running
# Windows: Check Services for "postgresql"
# Mac: brew services list | grep postgresql
# Linux: sudo systemctl status postgresql
```

#### B. Test database connection
```bash
# Connect to PostgreSQL
psql -U postgres

# Test if database exists
\l

# Connect to your database
\c wakaruku_petrol_db

# Test if tables exist
\dt
```

#### C. Check database credentials
Verify your `.env` file in the backend directory:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=wakaruku_petrol_db
DB_USER=postgres
DB_PASSWORD=your_password_here
```

### 6. Build/Compilation Errors

**Problem:** TypeScript or React compilation errors.

**Solutions:**

#### A. TypeScript errors
```bash
# Check TypeScript compilation
npx tsc --noEmit

# Fix any type errors shown
```

#### B. React component errors
- Check component imports/exports
- Verify all required props are provided
- Check for missing dependencies

#### C. CSS/Style issues
- Check if Tailwind CSS is properly configured
- Verify CSS imports in components

### 7. Performance Issues

**Problem:** Application is slow or unresponsive.

**Solutions:**

#### A. Check for infinite loops
- Look for state updates in useEffect without proper dependencies
- Check for recursive function calls

#### B. Optimize data fetching
- Add loading states
- Implement pagination for large datasets
- Use memoization for expensive calculations

#### C. Browser performance
- Clear browser cache
- Disable browser extensions that might interfere
- Check memory usage in browser dev tools

## 🔧 Debugging Steps

### Step 1: Check the Basics
1. ✅ Backend server running on port 5000?
2. ✅ Frontend server running on port 3001?
3. ✅ Database accessible?
4. ✅ No port conflicts?

### Step 2: Check Browser Console
1. Open Developer Tools (F12)
2. Check Console tab for errors
3. Check Network tab for failed requests
4. Check Application tab for localStorage issues

### Step 3: Check Server Logs
1. Backend terminal for API errors
2. Frontend terminal for compilation errors
3. Database logs for connection issues

### Step 4: Test Components Individually
1. Test login page first
2. Test dashboard after login
3. Test individual forms and features

## 🆘 Getting Help

### If you're still having issues:

1. **Check the logs:**
   - Backend terminal output
   - Frontend terminal output
   - Browser console errors

2. **Common error patterns:**
   - Port conflicts: "EADDRINUSE"
   - Missing dependencies: "Module not found"
   - Database errors: "Connection refused"
   - Authentication errors: "Invalid token"

3. **Restart everything:**
   ```bash
   # Stop all servers (Ctrl+C)
   # Restart backend
   cd backend
   npm run dev
   
   # In new terminal, restart frontend
   cd frontend
   npm run dev
   ```

4. **Reinstall dependencies:**
   ```bash
   # Remove node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

5. **Check system requirements:**
   - Node.js v18+
   - PostgreSQL v14+
   - Sufficient disk space
   - No firewall blocking ports

## 📞 When to Ask for Help

Contact support if you encounter:
- Persistent database connection issues
- Complex authentication problems
- Performance issues that don't resolve
- Security concerns
- Deployment problems

**Before asking for help, please provide:**
- Exact error messages (from console/logs)
- Steps to reproduce the issue
- Your system information (OS, Node.js version)
- What you've already tried