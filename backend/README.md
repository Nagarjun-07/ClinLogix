# Django Backend Structure

## 📁 Organized Folder Structure

```
backend/
├── api/
│   ├── views/
│   │   ├── student/
│   │   │   └── __init__.py      # Student-specific views
│   │   ├── instructor/
│   │   │   └── __init__.py      # Instructor-specific views
│   │   └── admin/
│   │       └── __init__.py      # Admin-specific views
│   ├── models.py                # Database models
│   ├── serializers.py           # API serializers
│   ├── views.py                 # Main views (imports from role folders)
│   └── urls.py                  # API URL routing
├── core/
│   ├── settings.py              # Django settings
│   └── urls.py                  # Project URLs
└── manage.py
```

## 🎯 API Endpoints by Role

### **Student Endpoints** (`/api/student/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/student/logs/` | GET | List student's log entries |
| `/api/student/logs/` | POST | Create new log entry |
| `/api/student/logs/{id}/` | GET/PUT/DELETE | Manage specific log |
| `/api/student/logs/stats/` | GET | Get logbook statistics |
| `/api/student/patients/` | GET | List assigned patients |

### **Instructor Endpoints** (`/api/instructor/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/instructor/reviews/` | GET | List student logs to review |
| `/api/instructor/reviews/pending/` | GET | Get pending reviews |
| `/api/instructor/reviews/{id}/approve/` | POST | Approve a log entry |
| `/api/instructor/reviews/{id}/reject/` | POST | Reject a log entry |
| `/api/instructor/students/` | GET | List assigned students |

### **Admin Endpoints** (`/api/admin/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/users/` | GET/POST | Manage users |
| `/api/admin/users/invite/` | POST | Invite new user |
| `/api/admin/institutions/` | GET/POST | Manage institutions |
| `/api/admin/patients/` | GET/POST | Manage patients |
| `/api/admin/assignments/` | GET/POST | Manage assignments |
| `/api/admin/assignments/assign_student_to_preceptor/` | POST | Assign student to preceptor |
| `/api/admin/assignments/assign_patient_to_student/` | POST | Assign patient to student |
| `/api/admin/dashboard/stats/` | GET | Get system statistics |

### **Common Endpoints**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/me/` | GET | Get current user profile |
| `/api/token/` | POST | Login (get JWT tokens) |
| `/api/token/refresh/` | POST | Refresh access token |

## 🔐 Authentication

All endpoints (except login) require JWT authentication:

```bash
Authorization: Bearer <access_token>
```

## 📝 Example Requests

### Student: Create Log Entry
```bash
POST /api/student/logs/
{
  "date": "2026-01-07",
  "location": "City Hospital",
  "specialty": "Cardiology",
  "hours": 8,
  "activities": "Patient rounds, case studies",
  "learning_objectives": "Understanding cardiac procedures",
  "reflection": "Great learning experience",
  "supervisor_name": "Dr. Smith",
  "patients_seen": 5
}
```

### Instructor: Approve Log
```bash
POST /api/instructor/reviews/{log_id}/approve/
{
  "feedback": "Excellent work! Well documented."
}
```

### Admin: Invite User
```bash
POST /api/admin/users/invite/
{
  "email": "newstudent@medical.edu",
  "full_name": "John Doe",
  "role": "student",
  "institution_id": "uuid-here"
}
```

## 🚀 Running the Backend

```bash
cd backend
.\venv\Scripts\python manage.py runserver 8000
```

Backend will be available at: `http://localhost:8000`

## 📊 Database - Supa

Connected to: **Supabase PostgreSQL** (live cloud database)

All data is stored in Supabase and can be viewed in:
- Django Admin: `http://localhost:8000/admin/`
- Supabase Dashboard: `https://supabase.com/dashboard`
