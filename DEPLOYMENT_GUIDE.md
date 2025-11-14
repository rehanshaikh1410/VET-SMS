# Deployment Guide: Render (Backend) + Vercel (Frontend)

## Overview
Your application has:
- **Backend**: Express.js + Node.js (MongoDB)
- **Frontend**: React + Vite
- **Database**: MongoDB Atlas (already configured)

This guide explains how to deploy the backend to Render and the frontend to Vercel.

---

## Step 1: Prepare Your Project

### Update package.json build scripts
Your `package.json` already has proper scripts:
- `npm run build` - Builds the Vite frontend
- `npm start` - Runs the server in production mode

### Build output location
- Frontend: `dist/public` (configured in vite.config.ts)
- Backend: Uses `dist/index.js` (Node.js)

---

## Step 2: Deploy Backend to Render

### Prerequisites
- Render account (free tier available)
- GitHub repository with your code pushed

### Steps

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/schoolsystem.git
   git branch -M main
   git push -u origin main
   ```

2. **Create Render Service**
   - Go to [render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure the service:
     - **Name**: `school-system-backend`
     - **Environment**: `Node`
     - **Build Command**: `npm install`
     - **Start Command**: `npm run build && npm start`
     - **Plan**: Free (or paid for production)

3. **Add Environment Variables in Render Dashboard**
   - Go to your service → Environment
   - Add the following variables:
     ```
     NODE_ENV = production
     MONGO_URI = mongodb+srv://vetadmin:deepak@cluster0.0u3ycor.mongodb.net/?appName=Cluster0
     PORT = 5004
     ```

4. **Deploy**
   - Render will auto-deploy when you push to GitHub
   - Copy your Render service URL (e.g., `https://school-system-backend.onrender.com`)

---

## Step 3: Deploy Frontend to Vercel

### Prerequisites
- Vercel account
- Same GitHub repository

### Steps

1. **Create .env.production file locally** (optional, for testing)
   ```
   VITE_API_BASE_URL=https://school-system-backend.onrender.com
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New..." → "Project"
   - Import your GitHub repository
   - Configure:
     - **Framework Preset**: Vite
     - **Root Directory**: `./` (leave as default)
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist/public`

3. **Add Environment Variables in Vercel**
   - In your Vercel project dashboard → Settings → Environment Variables
   - Add:
     ```
     VITE_API_BASE_URL = https://school-system-backend.onrender.com
     ```

4. **Deploy**
   - Click "Deploy"
   - Vercel will automatically redeploy on every push to GitHub

---

## Step 4: Update Frontend API Configuration

The frontend is configured to use the backend via the proxy or environment variable.

In `vite.config.ts`, the proxy is set for development:
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:5004',
    changeOrigin: true,
    secure: false,
  },
}
```

In production (Vercel), make sure your API calls use the `VITE_API_BASE_URL` environment variable.

**Update your API calls** if needed in `client/src/lib/api.ts`:
```typescript
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5004';
```

---

## Step 5: Test the Deployment

1. **Check Backend**
   - Visit: `https://school-system-backend.onrender.com` (you should see error or empty response)
   - Check logs in Render dashboard

2. **Check Frontend**
   - Visit: Your Vercel deployment URL
   - Open browser console for any API errors

3. **Test API Connection**
   - Make a test API call from frontend
   - Check that it's reaching your Render backend

---

## Environment Variables Summary

### Render (Backend)
```
NODE_ENV=production
MONGO_URI=mongodb+srv://vetadmin:deepak@cluster0.0u3ycor.mongodb.net/?appName=Cluster0
PORT=5004
```

### Vercel (Frontend)
```
VITE_API_BASE_URL=https://school-system-backend.onrender.com
```

---

## Troubleshooting

### Backend won't start on Render
- Check logs in Render dashboard: Logs tab
- Ensure `npm start` works locally: `npm run build && npm start`
- Verify MongoDB connection string is correct
- Check Node.js version compatibility

### Frontend can't connect to backend
- Verify CORS is enabled in `server/index.ts` ✅ (already configured)
- Check that API requests use the correct backend URL
- Ensure environment variables are set in Vercel

### MongoDB Connection Issues
- Verify IP whitelist in MongoDB Atlas (allow all IPs: 0.0.0.0/0 for free tier)
- Check username/password: `vetadmin` / `deepak`
- Ensure connection string doesn't have special characters that need escaping

### Build Failures
- Clear node_modules: `rm -r node_modules && npm install`
- Check for missing dependencies: `npm install`
- Verify TypeScript compilation: `npm run check`

---

## Quick Start Commands

```bash
# Local development
npm run dev

# Test production build locally
npm run build
npm start

# Push to GitHub and trigger automatic deployment
git push origin main
```

---

## Additional Notes

- **Render Free Tier**: Services spin down after 15 minutes of inactivity
- **Vercel Free Tier**: Sufficient for frontend hosting
- **MongoDB Atlas Free Tier**: Sufficient for development/testing
- Consider upgrading to paid plans for production use

---

## Contact & Support
For issues, check:
1. Render logs: Dashboard → Logs
2. Vercel logs: Dashboard → Deployments → Logs
3. MongoDB Atlas: Cluster → Logs
