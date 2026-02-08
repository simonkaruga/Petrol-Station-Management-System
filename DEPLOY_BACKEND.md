# Deploy Backend to Render

## Step 1: Create PostgreSQL Database

1. Go to https://dashboard.render.com
2. Click **New +** → **PostgreSQL**
3. Configure:
   - **Name**: `wakaruku-db`
   - **Database**: `wakaruku_petrol_db`
   - **User**: `wakaruku_user`
   - **Region**: Choose closest to your users (e.g., Oregon)
   - **Plan**: **Free** (or Starter $7/month for production)
4. Click **Create Database**
5. Wait for database to be created (~2 minutes)
6. **IMPORTANT**: Copy the **Internal Database URL**
   - Look for "Internal Database URL" section
   - Click the copy icon
   - Format: `postgresql://username:password@host:5432/database`
   - Example: `postgresql://wakaruku_user:abc123@dpg-xxxxx.oregon-postgres.render.com:5432/wakaruku_petrol_db`
   - **Save this URL - you'll need it in Step 3!**

## Step 2: Deploy Backend

1. Click **New +** → **Web Service**
2. Connect your GitHub repository: `simonkaruga/Wakaruku-Petrol-Station-Management-System`
3. Configure:
   - **Name**: `wakaruku-backend`
   - **Region**: ⚠️ **MUST match database region** (e.g., Oregon)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

⚠️ **CRITICAL**: Backend and database MUST be in the same region for internal connection to work!

## Step 3: Set Environment Variables

In the **Environment** section, add these variables:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `DATABASE_URL` | **Paste Internal Database URL from Step 1** |
| `JWT_SECRET` | **Generate using command below** |
| `JWT_REFRESH_SECRET` | **Generate using command below** |
| `JWT_EXPIRES_IN` | `8h` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `FRONTEND_URL` | Leave empty for now |
| `ALLOWED_ORIGINS` | Leave empty for now |

### DATABASE_URL Format:
```
postgresql://username:password@host:5432/database
```
👉 **Replace with the Internal Database URL from Render PostgreSQL**

Example:
```
postgresql://wakaruku_user:abc123xyz@dpg-xxxxx.oregon-postgres.render.com:5432/wakaruku_petrol_db
```

### Generate JWT Secrets:
```bash
# Run these commands locally to generate secure secrets:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Copy each output and paste as JWT_SECRET and JWT_REFRESH_SECRET**

## Step 4: Deploy

1. Click **Create Web Service**
2. Wait for deployment (5-10 minutes)
3. Your backend will be live at: `https://wakaruku-backend.onrender.com`

## Step 5: Initialize Database

After first deployment, run the setup script:

1. Go to your service → **Shell** tab
2. Run: `npm run setup`

Or manually create tables using the SQL in `setup-manual.sql`

## Step 6: Test Backend

Visit: `https://wakaruku-backend.onrender.com/api/health`

Should return:
```json
{
  "status": "ok",
  "timestamp": "...",
  "database": "connected"
}
```

## Important Notes

- Free tier sleeps after 15 minutes of inactivity
- First request after sleep takes ~30 seconds
- Database free tier expires after 90 days
- Upgrade to Starter ($7/month) for production use

## Troubleshooting

### 🔴 Database Connection Failed

#### 🔑 Why this happens:

1. **DATABASE_URL is wrong**
   - Using localhost instead of Render's internal DB URL
   - Typos in username/password/dbname/port

2. **Region mismatch**
   - Backend and Postgres are in different regions → internal connection fails

3. **SSL / Postgres config**
   - Render's managed Postgres requires SSL
   - Sequelize / Node Postgres needs SSL enabled

#### 🔧 How to fix step by step:

**1️⃣ Confirm DATABASE_URL**

It should look like this (exactly):
```
postgresql://username:password@render-db-host:5432/dbname
```

✅ **Do this:**
- Copy **Internal Database URL** from your Render Postgres service
- Do NOT use localhost or external URL
- Set it in Render Environment Variables:
  ```
  DATABASE_URL=postgresql://username:password@host:5432/database
  ```

**2️⃣ Check Regions**
- Go to Postgres service → Check Region (e.g., Oregon)
- Go to backend service → Must match exactly (e.g., Oregon)
- If they differ, redeploy backend in the same region as DB

**3️⃣ Verify SSL is enabled**

Your config files already have SSL enabled:
- `backend/config/database.js` ✅
- `backend/config/config.js` ✅

Both include:
```javascript
ssl: {
  require: true,
  rejectUnauthorized: false
}
```

**4️⃣ Restart backend**
- After fixing DATABASE_URL, click **Manual Deploy** → **Deploy latest commit**
- Watch Logs → should now show:
  ```
  Server running on port 10000
  ✅ Database connected successfully
  ```

**💡 Test connection locally:**
```bash
psql postgresql://username:password@host:5432/dbname
```
If it connects locally, backend will also connect on Render.

---

---

### Build Failed
- Check build logs in Render dashboard
- Verify `package.json` has all dependencies
- Ensure `npm install` completes successfully
- Check Node version compatibility

### App Crashes on Start
- Check application logs in Render dashboard
- Verify all environment variables are set correctly
- Ensure DATABASE_URL is the Internal URL (not External)
- Check that JWT_SECRET and JWT_REFRESH_SECRET are set

### Port Issues
- Render automatically assigns port (usually 10000)
- Your app should use `process.env.PORT` (already configured)
- Don't hardcode port 5000 in production

### Tables Not Created
- After first successful deployment, run database setup:
  1. Go to service → **Shell** tab
  2. Run: `npm run setup`
  3. Or manually run SQL from `setup-manual.sql`

## Your Backend URL

After deployment, your backend will be at:
```
https://wakaruku-backend.onrender.com
```

Use this URL for your frontend's `VITE_API_URL` environment variable.
