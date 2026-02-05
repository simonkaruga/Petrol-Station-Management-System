# 🚀 Wakaruku Petrol Station - Easy Start Guide

## The Easiest Way to Get Your Application Running

### Step 1: Start Backend (in one terminal)
```bash
cd backend
npm run dev
```
**Keep this terminal open!** You should see: "🚀 Wakaruku Petrol Station API running on port 5000"

### Step 2: Start Frontend (in another terminal)
```bash
cd frontend
./START_APP.sh
```

**OR manually:**
```bash
cd frontend
npm install date-fns react-icons react-hot-toast
npm run dev
```

### Step 3: Access Your Application
Open your browser and go to: **http://localhost:3002/**

### Step 4: Login
- **Username:** admin
- **Password:** Admin@123

## 🎯 What You Should See

1. **Login Page** with professional styling
2. **Dashboard** with:
   - Sales statistics
   - Fuel inventory levels
   - Navigation sidebar
   - User info and logout

## 🔧 If You Still See White Screen

1. **Check both terminals are running:**
   - Backend: `npm run dev` (port 5000)
   - Frontend: `npm run dev` (port 3002)

2. **Check browser console** (F12):
   - Look for any red error messages
   - Take a screenshot and share if you see errors

3. **Clear browser cache:**
   - Press Ctrl+F5 (hard refresh)
   - Or clear cache in browser settings

4. **Verify dependencies:**
   ```bash
   cd frontend
   npm install date-fns react-icons react-hot-toast
   ```

## 📞 Quick Help

**Common Issues:**
- ❌ "Module not found" → Run `npm install` again
- ❌ "Port already in use" → Kill other processes using ports 5000/3002
- ❌ "Cannot connect to API" → Make sure backend is running on port 5000
- ❌ "Login failed" → Use exact credentials: admin / Admin@123

**Need More Help?**
1. Check the browser console for specific error messages
2. Verify both servers are running
3. Make sure you're accessing http://localhost:3002/ (not 3000 or 3001)

## ✅ Success!

Once working, you'll have a complete petrol station management system with:
- Dashboard with real-time data
- Shift report recording
- Inventory tracking
- Credit management
- Expense tracking
- Reports and analytics
- User management (admin features)