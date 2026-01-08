# Student Clinical Logbook - Login Guide

## How to Run

### 1. Start Backend (Django)
```bash
cd "c:\Users\YOGESH\Downloads\Student Clinical Logbook UI 2\Student Clinical Logbook UI\backend"
.\venv\Scripts\python manage.py runserver 8000
```
Backend will run at: **http://localhost:8000**

### 2. Start Frontend (React/Vite)
Open a new terminal:
```bash
cd "c:\Users\YOGESH\Downloads\Student Clinical Logbook UI 2\Student Clinical Logbook UI"
npm run dev
```
Frontend will run at: **http://localhost:3000** (or 3001 if 3000 is busy)

---

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| **Student** | `student@medical.edu` | `password` |
| **Instructor** | `instructor@medical.edu` | `password123` |
| **Admin** | `admin@medical.edu` | `password123` |
| **Admin (alt)** | `admin@example.com` | `admin123` |

---

## Troubleshooting

### If login fails:

1. **Check browser console** (F12 → Console tab)
   - Look for detailed error messages
   - Check if API calls are reaching `http://localhost:8000/api/token/`

2. **Check Django terminal**
   - Look for any 500 errors or exceptions
   - Verify the server is running on port 8000

3. **Test login directly:**
   ```bash
   cd backend
   .\venv\Scripts\python test_login.py
   ```
   This should return tokens if the backend is working.

4. **Verify users exist:**
   ```bash
   cd backend
   .\venv\Scripts\python manage.py shell -c "exec(open('check_users.py').read())"
   ```

### Common Issues:

- **Port conflict**: Frontend might run on 3001 instead of 3000
- **CORS errors**: Make sure `CORS_ALLOW_ALL_ORIGINS = True` in `backend/core/settings.py`
- **Token errors**: Clear browser localStorage and try again

---

## API Endpoints

- **Login**: `POST http://localhost:8000/api/token/`
- **Refresh Token**: `POST http://localhost:8000/api/token/refresh/`
- **Get Current User**: `GET http://localhost:8000/api/me/`
- **Django Admin**: `http://localhost:8000/admin/`

---

## Next Steps After Login

Once logged in, you should see:
- **Student**: Student dashboard with logbook entries
- **Instructor**: Instructor dashboard with review capabilities
- **Admin**: Admin panel with user management

---

## Database Info

- **Type**: PostgreSQL (Supabase)
- **Connection**: Via pooler (configured in `.env`)
- **Models**: Auto-generated from existing Supabase schema
