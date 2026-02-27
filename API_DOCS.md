# 📋 TeleHealth API Documentation

> **Base URL (Local):** `http://localhost:5000`  
> **Base URL (Production):** `https://telehealth-backend-m97a.onrender.com`  
> **Interactive Swagger Docs (when running):** `{BASE_URL}/api-docs`

---

## 🔐 Authentication

All protected routes require a **Bearer Token** in the `Authorization` header:
```
Authorization: Bearer <your_jwt_token>
```

Tokens are returned from the login and signup endpoints. They expire in **7 days**.

---

## 👤 Demo Accounts

| Role    | Email                        | Password    |
|---------|------------------------------|-------------|
| Admin   | admin@telehealth.com         | admin123    |
| Doctor  | dr.sharma@telehealth.com     | doctor123   |
| Doctor  | dr.patel@telehealth.com      | doctor123   |
| Patient | ramesh.kumar@example.com     | patient123  |
| Patient | sunita.devi@example.com      | patient123  |

---

## 🌐 How to Access the Project

### Local Development
```bash
# 1. Install dependencies
npm install
cd backend && npm install
cd ../frontend && npm install

# 2. Setup environment (copy and fill in values)
cp .env.example .env

# 3. Setup database schema
cd backend && npm run db:setup

# 4. (Optional) Seed demo data
npm run seed

# 5. Run both frontend + backend together
cd .. && npm run dev
```

| Service        | URL                              |
|----------------|----------------------------------|
| Frontend       | http://localhost:3000            |
| Backend API    | http://localhost:5000            |
| Swagger Docs   | http://localhost:5000/api-docs   |

### Production (Cloud)
| Service        | URL                                          |
|----------------|----------------------------------------------|
| Frontend       | *(Your Vercel URL)*                          |
| Backend API    | https://telehealth-backend-m97a.onrender.com |
| Swagger Docs   | https://telehealth-backend-m97a.onrender.com/api-docs |

---

## 📡 API Endpoints

---

### 🔑 Auth

| Method | Endpoint           | Auth?  | Description                   |
|--------|--------------------|--------|-------------------------------|
| POST   | `/api/auth/signup` | ❌ No  | Register a new user           |
| POST   | `/api/auth/login`  | ❌ No  | Login and receive JWT token   |
| GET    | `/api/auth/me`     | ✅ Yes | Get current user profile      |
| POST   | `/api/auth/logout` | ✅ Yes | Logout and clear cookie       |

#### `POST /api/auth/signup`
```json
// Request Body
{
  "email": "user@example.com",
  "password": "password123",
  "role": "patient",       // or "doctor"
  "firstName": "John",
  "lastName": "Doe",
  "phone": "9876543210"    // optional
}

// Response 201
{
  "message": "Account created successfully",
  "token": "<jwt_token>",
  "user": { "id": "...", "email": "...", "role": "patient", ... }
}
```

#### `POST /api/auth/login`
```json
// Request Body
{ "email": "user@example.com", "password": "password123" }

// Response 200
{
  "message": "Login successful",
  "token": "<jwt_token>",
  "user": { "id": "...", "email": "...", "role": "patient", ... }
}
```

---

### 👨‍⚕️ Doctors

> Public endpoints (no auth needed): `GET /api/doctors`, `GET /api/doctors/:id`, `GET /api/doctors/:id/availability`, `GET /api/doctors/:id/busy-slots`  
> Protected endpoints (Doctor role required): profile, appointments, availability management

| Method | Endpoint                            | Auth?       | Description                        |
|--------|-------------------------------------|-------------|------------------------------------|
| GET    | `/api/doctors`                      | ❌ No       | List all approved doctors          |
| GET    | `/api/doctors/:id`                  | ❌ No       | Get doctor details by ID           |
| GET    | `/api/doctors/:id/availability`     | ❌ No       | Get doctor's weekly availability   |
| GET    | `/api/doctors/:id/busy-slots`       | ❌ No       | Get booked slots for a date        |
| GET    | `/api/doctors/me/profile`           | ✅ Doctor   | Get own profile                    |
| PUT    | `/api/doctors/me/profile`           | ✅ Doctor   | Update own profile                 |
| GET    | `/api/doctors/me/appointments`      | ✅ Doctor   | Get all doctor appointments        |
| GET    | `/api/doctors/me/availability`      | ✅ Doctor   | Get own availability slots         |
| POST   | `/api/doctors/me/availability`      | ✅ Doctor   | Add availability slot              |
| DELETE | `/api/doctors/me/availability/:id`  | ✅ Doctor   | Delete an availability slot        |
| GET    | `/api/doctors/patient-history/:id`  | ✅ Doctor   | Get patient medical history        |

#### `GET /api/doctors` — Query Parameters
| Param           | Type   | Description                     |
|-----------------|--------|---------------------------------|
| `specialization`| string | Filter by specialization        |
| `search`        | string | Search by name or specialization|
| `language`      | string | Filter by preferred language    |

#### `GET /api/doctors/:id/busy-slots` — Query Parameters
| Param  | Type   | Required | Description       |
|--------|--------|----------|-------------------|
| `date` | string | ✅ Yes   | Date (YYYY-MM-DD) |

#### `PUT /api/doctors/me/profile` — Request Body
```json
{
  "firstName": "Jane", "lastName": "Smith", "phone": "9876543210",
  "specialization": "Cardiologist", "qualification": "MBBS, MD",
  "experienceYears": 10, "hospitalName": "City Hospital",
  "hospitalAddress": "123 Main St", "registrationNumber": "MCI12345",
  "bio": "Experienced cardiologist...", "consultationFee": 500,
  "preferredLanguages": "English, Hindi"
}
```

#### `POST /api/doctors/me/availability` — Request Body
```json
{
  "dayOfWeek": 1,        // 0=Sunday, 1=Monday, ..., 6=Saturday
  "startTime": "09:00",  // HH:MM format
  "endTime": "17:00"
}
```

---

### 🧍 Patients

> All routes require authentication as a **Patient**.

| Method | Endpoint                        | Auth?       | Description                   |
|--------|---------------------------------|-------------|-------------------------------|
| GET    | `/api/patients/profile`         | ✅ Patient  | Get own profile               |
| PUT    | `/api/patients/profile`         | ✅ Patient  | Update own profile            |
| GET    | `/api/patients/appointments`    | ✅ Patient  | Get all appointments          |
| GET    | `/api/patients/medical-history` | ✅ Patient  | Get medical records           |
| GET    | `/api/patients/prescriptions`   | ✅ Patient  | Get all prescriptions         |

#### `PUT /api/patients/profile` — Request Body
```json
{
  "firstName": "John", "lastName": "Doe", "phone": "9876543210",
  "dateOfBirth": "1990-01-15", "gender": "male",
  "bloodGroup": "O+", "address": "123 Main St",
  "city": "Mumbai", "state": "Maharashtra", "pincode": "400001",
  "emergencyContact": "9876500001",
  "allergies": "Penicillin", "chronicConditions": "Diabetes"
}
```

---

### 📅 Appointments

> All routes require authentication (any logged-in user).

| Method | Endpoint                               | Auth?  | Description                          |
|--------|----------------------------------------|--------|--------------------------------------|
| POST   | `/api/appointments`                    | ✅ Yes | Book a new appointment               |
| GET    | `/api/appointments/:id`                | ✅ Yes | Get appointment details              |
| PATCH  | `/api/appointments/:id/status`         | ✅ Yes | Mark attendance (doctor/patient)     |
| POST   | `/api/appointments/:id/cancel`         | ✅ Yes | Cancel an appointment                |
| POST   | `/api/appointments/:id/reschedule`     | ✅ Yes | Reschedule an appointment            |
| POST   | `/api/appointments/:id/medical-record` | ✅ Doctor | Add medical record + prescription |

#### `POST /api/appointments` — Request Body
```json
{
  "doctorId": "uuid-of-doctor",
  "appointmentDate": "2026-03-15",   // YYYY-MM-DD
  "startTime": "10:00",              // HH:MM
  "endTime": "10:30",
  "symptoms": "Chest pain, shortness of breath"
}
```

#### `PATCH /api/appointments/:id/status` — Request Body
```json
{ "attended": true }  // true or false
```

#### `POST /api/appointments/:id/cancel` — Request Body
```json
{ "reason": "Personal emergency" }
```

#### `POST /api/appointments/:id/reschedule` — Request Body
```json
{
  "appointmentDate": "2026-03-20",
  "startTime": "14:00",
  "endTime": "14:30"
}
```

#### `POST /api/appointments/:id/medical-record` — Request Body (Doctor only)
```json
{
  "diagnosis": "Hypertension Stage 1",
  "symptoms": "Headache, dizziness",
  "notes": "Patient advised lifestyle changes",
  "vitalSigns": { "bp": "140/90", "pulse": 80, "temp": 98.6 },
  "medications": [
    { "name": "Amlodipine", "dosage": "5mg", "frequency": "Once daily" }
  ],
  "instructions": "Take medication after meals. Follow up in 2 weeks."
}
```

---

### 🎥 Video Calling

> All routes require authentication.

| Method | Endpoint            | Auth?  | Description                                      |
|--------|---------------------|--------|--------------------------------------------------|
| POST   | `/api/video/token`  | ✅ Yes | Get Agora token for video call                   |
| POST   | `/api/video/end-call` | ✅ Yes | End the video call and mark appointment done   |

#### `POST /api/video/token` — Request Body
```json
{ "appointmentId": "uuid-of-appointment" }
```

#### Response
```json
{
  "token": "<agora_rtc_token>",
  "channelName": "appointment_1234567890_user-id",
  "appId": "agora-app-id",
  "uid": 0
}
```

> ⚠️ Calls can only be joined **±15 minutes** from the appointment time.

#### `POST /api/video/end-call` — Request Body
```json
{ "appointmentId": "uuid-of-appointment" }
```

---

### 📰 Health Articles

> Public read access. Write access requires Admin.

| Method | Endpoint                    | Auth?     | Description                      |
|--------|-----------------------------|-----------|----------------------------------|
| GET    | `/api/health-articles`      | ❌ No     | Get all published articles       |
| GET    | `/api/health-articles/:id`  | ❌ No     | Get article by ID                |

#### `GET /api/health-articles` — Query Parameters
| Param      | Type   | Description                        |
|------------|--------|------------------------------------|
| `category` | string | Filter by category (optional)      |

---

### 🔎 Search (Doctor & Admin Only)

| Method | Endpoint                                  | Auth?              | Description                          |
|--------|-------------------------------------------|--------------------|--------------------------------------|
| GET    | `/api/search/patients`                    | ✅ Doctor/Admin    | Search patients by name/email/phone  |
| GET    | `/api/search/patients/:patientId/overview`| ✅ Doctor/Admin    | Get full patient medical overview    |

#### `GET /api/search/patients` — Query Parameters
| Param | Type   | Required | Description         |
|-------|--------|----------|---------------------|
| `q`   | string | ✅ Yes   | Search query string |

---

### 👑 Admin

> All routes require **Admin** authentication.

| Method | Endpoint                              | Auth?      | Description                        |
|--------|---------------------------------------|------------|------------------------------------|
| GET    | `/api/admin/stats`                    | ✅ Admin   | Get system-wide statistics         |
| GET    | `/api/admin/users`                    | ✅ Admin   | List all users (filter by role)    |
| GET    | `/api/admin/doctors/pending`          | ✅ Admin   | List doctors pending approval      |
| POST   | `/api/admin/doctors/:id/approve`      | ✅ Admin   | Approve a doctor account           |
| POST   | `/api/admin/users/:id/deactivate`     | ✅ Admin   | Deactivate a user account          |
| POST   | `/api/admin/users/:id/activate`       | ✅ Admin   | Re-activate a user account         |
| GET    | `/api/admin/health-articles`          | ✅ Admin   | Get all articles (incl. unpublished)|
| POST   | `/api/admin/health-articles`          | ✅ Admin   | Create a health article            |
| PUT    | `/api/admin/health-articles/:id`      | ✅ Admin   | Update a health article            |
| DELETE | `/api/admin/health-articles/:id`      | ✅ Admin   | Delete a health article            |

#### `GET /api/admin/users` — Query Parameters
| Param  | Type   | Description                                  |
|--------|--------|----------------------------------------------|
| `role` | string | Filter by role: `patient`, `doctor`, `admin` |

#### `POST /api/admin/health-articles` — Request Body
```json
{
  "title": "Managing Diabetes",
  "content": "Full article content here...",
  "category": "Diabetes",
  "isPublished": true
}
```

---

## 📊 Appointment Status Flow

```
booked → scheduled → in_progress → completed
                   ↘ cancelled
                   ↘ missed (auto-set by cron job)
```

---

## ⚡ Real-Time Events (Socket.io)

Connect to: `ws://{BASE_URL}`

| Event                  | Direction      | Description                            |
|------------------------|----------------|----------------------------------------|
| `join`                 | Client → Server | Join a room (e.g. `user_<id>`)        |
| `appointment_created`  | Server → Client | New appointment booked                 |
| `appointment_updated`  | Server → Client | Appointment status/data changed        |
| `AVAILABILITY_UPDATE`  | Server → Client | Doctor availability changed            |
| `DOCTOR_UPDATED`       | Server → Client | Doctor profile updated                 |

---

## ❗ Common Error Responses

| HTTP Code | Meaning                              |
|-----------|--------------------------------------|
| 400       | Bad request / validation error       |
| 401       | Unauthorized — missing/invalid token |
| 403       | Forbidden — insufficient role        |
| 404       | Resource not found                   |
| 500       | Internal server error                |

---

## 💡 Better Documentation Tools

If you want to share docs without running the project, consider:

1. **Postman Collection** — Import this doc's endpoints into Postman and export as a public collection URL.
2. **[Swagger Editor](https://editor.swagger.io/)** — Paste the OpenAPI spec (from `/api-docs` JSON) to view interactive docs online.
3. **GitHub Pages** — Host this `API_DOCS.md` as a rendered page automatically via GitHub.
