# 🚀 Deployment Guide - TeleHealth System

## Complete Step-by-Step Deployment Instructions

This guide will help you deploy the TeleHealth system to **free hosting platforms** in ~20 minutes.

---

## 📋 Prerequisites

Before deploying, you need:

1. ✅ **GitHub Account** (free) - https://github.com
2. ✅ **Vercel Account** (free) - https://vercel.com
3. ✅ **Render Account** (free) - https://render.com
4. ✅ **Agora Account** (free) - https://console.agora.io

---

## Part 1: Get Agora Credentials (5 minutes)

### Step 1: Create Agora Account
1. Go to https://console.agora.io/
2. Click "Sign Up" and create account
3. Verify your email

### Step 2: Create Project
1. Click "Create Project"
2. Project Name: `TeleHealth`
3. Use Case: Select "Video Calling"
4. Authentication: Choose "Secured mode: APP ID + Token"
5. Click "Submit"

### Step 3: Get Credentials
1. Click on your project name
2. Copy **App ID** (looks like: `a1b2c3d4e5f6...`)
3. Click "Enable" on App Certificate
4. Copy **App Certificate** (looks like: `x1y2z3a4b5c6...`)

**Save these - you'll need them later!**

---

## Part 2: Push Code to GitHub (5 minutes)

### Step 1: Initialize Git Repository

Open terminal in project folder:

```bash
cd C:\Users\Vivek\OneDrive\Documents\Capstone

# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - TeleHealth System"
```

### Step 2: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `telehealth-system`
3. Description: `Cloud-Based Telehealth Support System`
4. Keep it **Public** (required for free hosting)
5. Click "Create repository"

### Step 3: Push to GitHub

```bash
# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/telehealth-system.git

# Push code
git branch -M main
git push -u origin main
```

---

## Part 3: Deploy Backend to Render (7 minutes)

### Step 1: Create Render Account
1. Go to https://render.com
2. Sign up with GitHub (easier)
3. Authorize Render to access your repositories

### Step 2: Create PostgreSQL Database

1. Click "New +" → "PostgreSQL"
2. Name: `telehealth-db`
3. Database: `telehealth`
4. User: `telehealth_user`
5. Region: Choose closest to you
6. Plan: **Free**
7. Click "Create Database"
8. **Wait 2-3 minutes** for database to be ready
9. Copy the **Internal Database URL** (starts with `postgresql://`)

### Step 3: Deploy Backend Service

1. Click "New +" → "Web Service"
2. Connect your GitHub repository: `telehealth-system`
3. Configure:
   - **Name**: `telehealth-backend`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: **Free**

4. Click "Advanced" → Add Environment Variables:

```
NODE_ENV=production
PORT=5000
DATABASE_URL=<paste your Internal Database URL from Step 2>
JWT_SECRET=telehealth_secret_key_production_2024
JWT_EXPIRES_IN=7d
AGORA_APP_ID=<paste your Agora App ID>
AGORA_APP_CERTIFICATE=<paste your Agora App Certificate>
FRONTEND_URL=https://telehealth-system.vercel.app
```

5. Click "Create Web Service"
6. **Wait 5-10 minutes** for deployment
7. Once deployed, copy your backend URL (e.g., `https://telehealth-backend.onrender.com`)

### Step 4: Run Database Setup

1. In Render dashboard, go to your backend service
2. Click "Shell" tab
3. Run: `npm run db:setup`
4. Run: `npm run seed`
5. You should see "Database setup complete!" and "Seed data inserted!"

---

## Part 4: Deploy Frontend to Vercel (5 minutes)

### Step 1: Create Vercel Account
1. Go to https://vercel.com
2. Sign up with GitHub
3. Authorize Vercel

### Step 2: Import Project

1. Click "Add New..." → "Project"
2. Import `telehealth-system` repository
3. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### Step 3: Add Environment Variables

Click "Environment Variables" and add:

```
NEXT_PUBLIC_API_URL=<paste your Render backend URL>
NEXT_PUBLIC_AGORA_APP_ID=<paste your Agora App ID>
```

Example:
```
NEXT_PUBLIC_API_URL=https://telehealth-backend.onrender.com
NEXT_PUBLIC_AGORA_APP_ID=a1b2c3d4e5f6g7h8i9j0
```

### Step 4: Deploy

1. Click "Deploy"
2. **Wait 2-3 minutes** for deployment
3. Once done, you'll get your live URL!

Example: `https://telehealth-system.vercel.app`

---

## Part 5: Update Backend CORS (2 minutes)

### Step 1: Update Frontend URL in Render

1. Go back to Render dashboard
2. Open your backend service
3. Go to "Environment" tab
4. Update `FRONTEND_URL` to your actual Vercel URL
   - Example: `https://telehealth-system-abc123.vercel.app`
5. Click "Save Changes"
6. Service will automatically redeploy

---

## 🎉 Your App is Live!

### Access Your Deployed App

**Frontend URL**: `https://your-app.vercel.app`
**Backend API**: `https://your-backend.onrender.com`
**API Docs**: `https://your-backend.onrender.com/api-docs`

### Demo Accounts

**Patient:**
- Email: `ramesh.kumar@example.com`
- Password: `patient123`

**Doctor:**
- Email: `dr.sharma@telehealth.com`
- Password: `doctor123`

**Admin:**
- Email: `admin@telehealth.com`
- Password: `admin123`

---

## 🔧 Troubleshooting

### Backend Not Starting
- Check environment variables are set correctly
- Verify DATABASE_URL is the Internal URL from Render
- Check logs in Render dashboard

### Frontend Can't Connect to Backend
- Verify NEXT_PUBLIC_API_URL is correct
- Check CORS settings (FRONTEND_URL in backend)
- Ensure backend is deployed and running

### Video Calling Not Working
- Verify Agora App ID is correct
- Check App Certificate is set
- Ensure Agora project is in "Secured mode"

### Database Connection Error
- Verify DATABASE_URL is correct
- Check if database is running in Render
- Try running `npm run db:setup` again in Shell

---

## 📊 Free Tier Limits

**Vercel (Frontend):**
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Automatic HTTPS
- ✅ Global CDN

**Render (Backend + Database):**
- ✅ 750 hours/month (enough for 1 service)
- ✅ PostgreSQL with 1GB storage
- ⚠️ Service sleeps after 15 min inactivity (wakes on request)
- ⚠️ First request may be slow (cold start)

**Agora (Video):**
- ✅ 10,000 minutes/month free
- ✅ Unlimited projects
- ✅ Full features

---

## 🔄 Updating Your Deployment

### To Deploy Changes:

```bash
# Make your changes
git add .
git commit -m "Update: description of changes"
git push

# Vercel and Render will auto-deploy!
```

---

## 🎯 Production Checklist

Before going to production:

- [ ] Change JWT_SECRET to a strong random string
- [ ] Set up custom domain (optional)
- [ ] Enable database backups
- [ ] Set up monitoring/logging
- [ ] Test all features thoroughly
- [ ] Configure rate limiting
- [ ] Set up email notifications (optional)

---

## 💡 Alternative Deployment Options

### Option 2: Railway (All-in-One)
- Deploy both frontend and backend
- PostgreSQL included
- Free tier: $5 credit/month

### Option 3: Netlify + Railway
- Netlify for frontend
- Railway for backend + database

### Option 4: Self-Hosted
- VPS (DigitalOcean, Linode)
- Docker containers
- More control, requires setup

---

## 📞 Need Help?

- **Vercel Docs**: https://vercel.com/docs
- **Render Docs**: https://render.com/docs
- **Agora Docs**: https://docs.agora.io/

---

**Your TeleHealth system is now live and accessible worldwide! 🌍**
