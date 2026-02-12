# 🏥 TeleHealth - Cloud-Based Telehealth Support System

> **Production-grade telehealth platform for remote and rural healthcare**

A comprehensive cloud-based telehealth system providing remote medical consultations, centralized medical records, and seamless doctor-patient workflows for underserved rural communities.

---

## 📋 Table of Contents

- [Problem Statement](#-problem-statement)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Running the Application](#-running-the-application)
- [Database Setup](#-database-setup)
- [Seed Data](#-seed-data)
- [API Documentation](#-api-documentation)
- [User Roles & Workflows](#-user-roles--workflows)
- [Video Calling](#-video-calling)
- [Deployment](#-deployment)
- [Screenshots](#-screenshots)
- [Future Enhancements](#-future-enhancements)
- [License](#-license)

---

## 🎯 Problem Statement

Rural and remote areas face critical healthcare challenges:

- **Doctor Shortage**: Limited access to qualified medical professionals
- **Transportation Barriers**: Poor infrastructure prevents hospital visits
- **Fragmented Records**: No centralized medical history
- **Emergency Care**: No real-time access to consultations

### Our Solution

TeleHealth bridges this gap by providing:

✅ **Remote Teleconsultation** - Audio/video calls with doctors  
✅ **Cloud-Based Records** - Centralized, secure medical history  
✅ **Smart Scheduling** - Conflict-free appointment booking  
✅ **Multi-Role Workflows** - Separate patient, doctor, and admin portals  
✅ **Scalable Infrastructure** - Cloud-native architecture

---

## ✨ Features

### For Patients 🧍

- ✅ Signup & Login with secure authentication
- ✅ Complete profile management
- ✅ Search doctors by specialty, rating, and availability
- ✅ Book, reschedule, and cancel appointments
- ✅ Join audio/video consultations
- ✅ Access medical history and prescriptions
- ✅ View health tips and articles

### For Doctors 👨‍⚕️

- ✅ Professional profile creation
- ✅ Set availability calendar with time slots
- ✅ View upcoming appointments
- ✅ Access patient medical history
- ✅ Conduct video consultations
- ✅ Add consultation notes and prescriptions
- ✅ Manage appointment status

### For Admins 🔐

- ✅ User management (patients & doctors)
- ✅ Approve/deactivate doctor accounts
- ✅ System statistics dashboard
- ✅ Health content management
- ✅ Audit and monitoring

### Core System Features

- 🎥 **WebRTC Video Calling** via Agora SDK
- 📅 **Calendar-Based Scheduling** with conflict detection
- 🔒 **JWT Authentication** with role-based access control
- 📊 **Centralized Medical Records** with full history
- 🌐 **RESTful API** with Swagger documentation
- 📱 **Responsive Design** - Mobile-first approach

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (React 18)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Video SDK**: Agora RTC SDK

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **Authentication**: JWT + bcrypt
- **Video Tokens**: Agora Access Token
- **API Docs**: Swagger/OpenAPI

### Why This Stack?

1. **Next.js**: Server-side rendering for better performance on slow rural connections
2. **PostgreSQL**: ACID compliance for medical data integrity
3. **Agora SDK**: Low bandwidth optimization crucial for rural areas
4. **TypeScript**: Type safety for production-grade code
5. **JWT**: Stateless, scalable authentication

---

## 🏗️ Architecture

```
┌─────────────────┐
│   Next.js App   │  ← Frontend (Port 3000)
│   (React/TS)    │
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────┐
│  Express API    │  ← Backend (Port 5000)
│   (Node/TS)     │
└────────┬────────┘
         │
    ┌────┴────┬──────────┐
    ▼         ▼          ▼
┌────────┐ ┌──────┐ ┌─────────┐
│ PostgreSQL│ │ JWT  │ │ Agora   │
│  Database │ │ Auth │ │ Video   │
└───────────┘ └──────┘ └─────────┘
```

### Database Schema

- `users` - Shared table for all roles
- `patient_profiles` - Patient-specific data
- `doctor_profiles` - Doctor credentials & info
- `appointments` - Scheduling with video channels
- `availability_slots` - Doctor calendar
- `medical_records` - Consultation history
- `prescriptions` - Medication records
- `health_articles` - Educational content

---

## 📦 Prerequisites

Before you begin, ensure you have:

- **Node.js** 18+ and npm
- **PostgreSQL** 14+ installed and running
- **Agora Account** (free tier available)
- **Git** for version control

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Capstone
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

## ⚙️ Configuration

### 1. Create Environment Files

Create `.env` in the root directory:

```env
# Backend Configuration
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/telehealth_db

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Agora Video SDK
AGORA_APP_ID=your-agora-app-id
AGORA_APP_CERTIFICATE=your-agora-app-certificate

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_AGORA_APP_ID=your-agora-app-id
```

### 2. Get Agora Credentials

1. Go to [Agora.io](https://www.agora.io/)
2. Sign up for a free account
3. Create a new project
4. Copy your **App ID** and **App Certificate**
5. Paste them in your `.env` file

### 3. Setup PostgreSQL Database

```bash
# Create database
createdb telehealth_db

# Or using psql
psql -U postgres
CREATE DATABASE telehealth_db;
\q
```

---

## 🏃 Running the Application

### Option 1: Run Everything Together

```bash
# From root directory
npm run dev
```

This starts both frontend (port 3000) and backend (port 5000) concurrently.

### Option 2: Run Separately

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api-docs

---

## 🗄️ Database Setup

### Initialize Schema

```bash
cd backend
npm run db:setup
```

This creates all tables, indexes, and triggers.

---

## 🌱 Seed Data

Populate the database with sample data:

```bash
cd backend
npm run seed
```

### Demo Accounts Created

**Admin:**
- Email: `admin@telehealth.com`
- Password: `admin123`

**Doctors (4):**
- Email: `dr.sharma@telehealth.com` (Cardiologist)
- Email: `dr.patel@telehealth.com` (General Physician)
- Email: `dr.kumar@telehealth.com` (Pediatrician)
- Email: `dr.reddy@telehealth.com` (Dermatologist)
- Password: `doctor123` (all doctors)

**Patients (5):**
- Email: `ramesh.kumar@example.com`
- Email: `sunita.devi@example.com`
- Email: `vijay.singh@example.com`
- Email: `anita.sharma@example.com`
- Email: `mohan.lal@example.com`
- Password: `patient123` (all patients)

---

## 📚 API Documentation

### Swagger UI

Visit http://localhost:5000/api-docs for interactive API documentation.

### Key Endpoints

#### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

#### Patients
- `GET /api/patients/profile` - Get patient profile
- `PUT /api/patients/profile` - Update profile
- `GET /api/patients/appointments` - Get appointments
- `GET /api/patients/medical-history` - Get medical history

#### Doctors
- `GET /api/doctors` - List all doctors (public)
- `GET /api/doctors/:id` - Get doctor details
- `GET /api/doctors/me/profile` - Get own profile
- `GET /api/doctors/me/appointments` - Get appointments
- `POST /api/doctors/me/availability` - Add availability slot

#### Appointments
- `POST /api/appointments` - Book appointment
- `GET /api/appointments/:id` - Get appointment details
- `POST /api/appointments/:id/cancel` - Cancel appointment
- `POST /api/appointments/:id/reschedule` - Reschedule
- `POST /api/appointments/:id/medical-record` - Add consultation notes

#### Video
- `POST /api/video/token` - Get Agora token for call
- `POST /api/video/end-call` - End video call

#### Admin
- `GET /api/admin/stats` - System statistics
- `GET /api/admin/users` - List all users
- `POST /api/admin/doctors/:id/approve` - Approve doctor
- `POST /api/admin/users/:id/deactivate` - Deactivate user

---

## 👥 User Roles & Workflows

### Patient Workflow

1. **Signup** → Create account
2. **Complete Profile** → Add medical info
3. **Search Doctors** → Filter by specialty
4. **Book Appointment** → Select available slot
5. **Join Video Call** → At appointment time
6. **View Prescription** → After consultation

### Doctor Workflow

1. **Signup** → Create professional profile
2. **Await Approval** → Admin verifies credentials
3. **Set Availability** → Define working hours
4. **View Appointments** → Check schedule
5. **Join Video Call** → Consult patient
6. **Add Notes** → Record diagnosis & prescription

### Admin Workflow

1. **Login** → Access admin panel
2. **Review Doctors** → Approve new registrations
3. **Monitor System** → View statistics
4. **Manage Content** → Add health articles
5. **User Management** → Activate/deactivate accounts

---

## 🎥 Video Calling

### How It Works

1. **Time-Gated Access**: Calls can only be joined ±15 minutes from appointment time
2. **Secure Tokens**: Backend generates Agora tokens with expiration
3. **Channel Naming**: Each appointment gets unique channel ID
4. **Bandwidth Optimization**: Automatic fallback to audio-only on poor connection
5. **Call Controls**: Mute/unmute audio, enable/disable video, end call

### Agora Integration

```typescript
// Backend generates token
const token = RtcTokenBuilder.buildTokenWithUid(
  appId,
  appCertificate,
  channelName,
  uid,
  role,
  privilegeExpiredTs
);

// Frontend joins channel
await client.join(appId, channelName, token, null);
```

---

## 🚢 Deployment

### Backend (Railway/Render)

1. Create account on Railway or Render
2. Connect GitHub repository
3. Add environment variables
4. Deploy from `backend` directory
5. Run database migrations

### Frontend (Vercel)

1. Create account on Vercel
2. Import GitHub repository
3. Set root directory to `frontend`
4. Add environment variables
5. Deploy

### Database (Railway/Supabase)

1. Create PostgreSQL instance
2. Copy connection string
3. Update `DATABASE_URL` in backend
4. Run schema setup

---

## 📸 Screenshots

*(Screenshots would be added here after running the application)*

- Landing Page
- Patient Dashboard
- Doctor Listing
- Appointment Booking
- Video Call Interface
- Medical History
- Admin Panel

---

## 🔮 Future Enhancements

- [ ] **AI Symptom Checker** - Pre-consultation triage
- [ ] **Prescription OCR** - Upload and digitize paper prescriptions
- [ ] **Health Monitoring** - Integration with wearable devices
- [ ] **Multi-language Support** - Regional language interfaces
- [ ] **Offline Mode** - PWA with offline capabilities
- [ ] **Payment Integration** - Online consultation fees
- [ ] **Chat Feature** - Text-based consultation option
- [ ] **Mobile Apps** - Native iOS and Android apps
- [ ] **Analytics Dashboard** - Advanced health insights
- [ ] **Telemedicine Kiosks** - Hardware integration for rural centers

---

## 📄 License

MIT License - feel free to use this project for educational purposes.

---

## 🙏 Acknowledgments

- **Agora.io** - Video calling infrastructure
- **Next.js Team** - Amazing React framework
- **PostgreSQL** - Reliable database system
- **Open Source Community** - For incredible tools and libraries

---

## 📞 Support

For issues or questions:
- Email: support@telehealth.com
- GitHub Issues: [Create an issue](https://github.com/your-repo/issues)

---

**Built with ❤️ for rural healthcare**
