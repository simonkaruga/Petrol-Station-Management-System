# Deploy Backend to Render

## Step 1: Create PostgreSQL Database

1. Go to https://dashboard.render.com
2. Click **New +** → **PostgreSQL**
3. Configure:
   - **Name**: `wakaruku-db`
   - **Database**: `wakaruku_petrol_db`
   - **User**: `wakaruku_user`
   - **Region**: Choose closest to your users
   - **Plan**: Free (or Starter $7/month for production)
4. Click **Create Database**
5. Copy the **Internal Database URL** (starts with `postgresql://`)

## Step 2: Deploy Backend

1. Click **New +** → **Web Service**
2. Connect your GitHub repository: `simonkaruga/Wakaruku-Petrol-Station-Management-System`
3. Configure:
   - **Name**: `wakaruku-backend`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

## Step 3: Set Environment Variables

In the **Environment** section, add:

```
NODE_ENV=production
PORT=5000
DATABASE_URL=[paste Internal Database URL from Step 1]
JWT_SECRET=[generate random 32+ character string]
JWT_REFRESH_SECRET=[generate different random 32+ character string]
JWT_EXPIRES_IN=8h
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=[your frontend URL - add after frontend deployment]
ALLOWED_ORIGINS=[your frontend URL - add after frontend deployment]
```

### Generate Secrets:
```bash
# Run these commands to generate secure secrets:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

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

### Database Connection Failed
- Verify DATABASE_URL is correct
- Check database is in same region
- Ensure SSL is enabled in config

### Build Failed
- Check build logs
- Verify package.json is correct
- Ensure all dependencies are listed

### App Crashes
- Check application logs
- Verify all environment variables are set
- Check database connection

## Your Backend URL

After deployment, your backend will be at:
```
https://wakaruku-backend.onrender.com
```

Use this URL for your frontend's `VITE_API_URL` environment variable.
