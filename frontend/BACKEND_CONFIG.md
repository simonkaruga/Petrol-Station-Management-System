# Frontend Configuration Guide

## Backend URL Configuration

Your frontend is configured to automatically use the correct backend URL based on the environment.

### 🔧 Environment Files:

1. **`.env`** - Development (local)
   ```
   VITE_API_URL=http://localhost:5000
   ```

2. **`.env.production`** - Production (deployed)
   ```
   VITE_API_URL=https://wakaruku-petrol-station-management-system.onrender.com
   ```

## 🚀 Usage:

### Development Mode (Local):
```bash
npm run dev
```
- Uses `http://localhost:5000`
- Connects to your local backend

### Production Build:
```bash
npm run build
```
- Automatically uses `.env.production`
- Uses `https://wakaruku-petrol-station-management-system.onrender.com`
- Creates optimized build in `dist/` folder

### Preview Production Build Locally:
```bash
npm run build
npm run preview
```
- Test production build locally
- Uses production backend URL

## 🔄 Switch Backend URL Manually:

### Option 1: Edit `.env` file
```bash
# For local backend
VITE_API_URL=http://localhost:5000

# For production backend
VITE_API_URL=https://wakaruku-petrol-station-management-system.onrender.com
```

### Option 2: Use environment variable
```bash
VITE_API_URL=https://wakaruku-petrol-station-management-system.onrender.com npm run dev
```

## 📝 Current Configuration:

✅ **Development:** `http://localhost:5000`  
✅ **Production:** `https://wakaruku-petrol-station-management-system.onrender.com`

## 🧪 Test Backend Connection:

### Check if backend is running:
```bash
curl https://wakaruku-petrol-station-management-system.onrender.com/api/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "...",
  "uptime": 123
}
```

## 🔍 Verify Current API URL:

Open browser console and run:
```javascript
console.log(import.meta.env.VITE_API_URL);
```

## ⚠️ Important Notes:

1. **Restart dev server** after changing `.env` files
2. **Rebuild** after changing `.env.production`
3. **Don't commit** `.env.local` or `.env.production.local` files
4. **CORS**: Backend must allow your frontend URL

## 🌐 Update Backend CORS:

Add your frontend URL to backend environment variables on Render:

```
ALLOWED_ORIGINS=https://your-frontend-url.com,http://localhost:3000
```

## 📦 Deploy Frontend:

When deploying to Vercel/Netlify/Render:

1. Set environment variable:
   - Key: `VITE_API_URL`
   - Value: `https://wakaruku-petrol-station-management-system.onrender.com`

2. Or use `.env.production` (already configured)

## ✅ You're All Set!

Your frontend will automatically:
- Use local backend in development
- Use production backend when built for production
