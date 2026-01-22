# 🚀 Quick Setup Guide

## Step-by-Step Installation

### 1. Install PostgreSQL

**Windows:**
- Download from https://www.postgresql.org/download/windows/
- Run installer and remember your password
- Default port: 5432

**Mac:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Linux:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE telehealth_db;

# Exit
\q
```

### 3. Get Agora Credentials

1. Visit https://console.agora.io/
2. Sign up (free tier available)
3. Create new project:
   - Project name: "TeleHealth"
   - Use case: "Video Calling"
   - Authentication: "Secured mode: APP ID + Token"
4. Copy **App ID** and **App Certificate**

### 4. Configure Environment

Create `.env` file in root directory:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/telehealth_db
JWT_SECRET=telehealth_secret_key_2024
JWT_EXPIRES_IN=7d
AGORA_APP_ID=paste_your_app_id_here
AGORA_APP_CERTIFICATE=paste_your_certificate_here
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_AGORA_APP_ID=paste_your_app_id_here
```

### 5. Install Dependencies

```bash
# Root
npm install

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
cd ..
```

### 6. Setup Database Schema

```bash
cd backend
npm run db:setup
```

### 7. Seed Sample Data

```bash
npm run seed
```

### 8. Run Application

```bash
# From root directory
npm run dev
```

Or run separately:

**Terminal 1:**
```bash
cd backend
npm run dev
```

**Terminal 2:**
```bash
cd frontend
npm run dev
```

### 9. Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Docs**: http://localhost:5000/api-docs

### 10. Login with Demo Accounts

**Patient:**
- Email: ramesh.kumar@example.com
- Password: patient123

**Doctor:**
- Email: dr.sharma@telehealth.com
- Password: doctor123

**Admin:**
- Email: admin@telehealth.com
- Password: admin123

---

## Troubleshooting

### Database Connection Error

```bash
# Check if PostgreSQL is running
# Windows
pg_ctl status

# Mac/Linux
brew services list  # Mac
sudo systemctl status postgresql  # Linux

# Restart if needed
brew services restart postgresql@14  # Mac
sudo systemctl restart postgresql  # Linux
```

### Port Already in Use

```bash
# Kill process on port 5000
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:5000 | xargs kill -9
```

### Agora Video Not Working

1. Check if App ID is correct in `.env`
2. Ensure App Certificate is set
3. Verify project is in "Secured mode"
4. Check browser permissions for camera/microphone

### Module Not Found Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Or for specific package
cd backend  # or frontend
rm -rf node_modules package-lock.json
npm install
```

---

## Production Deployment Checklist

- [ ] Change JWT_SECRET to strong random string
- [ ] Update DATABASE_URL to production database
- [ ] Set NODE_ENV=production
- [ ] Enable SSL for database connection
- [ ] Configure CORS for production domain
- [ ] Set up environment variables in hosting platform
- [ ] Run database migrations
- [ ] Test video calling in production
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy

---

## Need Help?

- Check the main [README.md](./README.md)
- Review API docs at http://localhost:5000/api-docs
- Check console logs for errors
- Verify all environment variables are set
