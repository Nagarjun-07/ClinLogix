# API Endpoint Migration Guide

## ⚠️ Important: API Endpoints Have Changed

The backend has been restructured for better organization. Here are the endpoint changes:

### Old vs New Endpoints

| Old Endpoint | New Endpoint | Purpose |
|--------------|--------------|---------|
| `/api/authorized-users/` | `/api/admin/users/` | List users |
| `/api/authorized-users/` (POST) | `/api/admin/users/invite/` | Invite user |
| `/api/logs/` | `/api/student/logs/` | Student logs |
| `/api/profiles/` | `/api/me/` | Current user profile |
| `/api/patients/` | `/api/student/patients/` | Student's patients |
| `/api/institutions/` | `/api/admin/institutions/` | Institutions |

## Updated Frontend API Calls

The following files have been updated:
- ✅ `src/services/api.ts` - Updated to use new endpoints

## New Endpoint Structure

### Student Endpoints (`/api/student/`)
- `GET /api/student/logs/` - List student's logs
- `POST /api/student/logs/` - Create new log
- `GET /api/student/logs/stats/` - Get statistics
- `GET /api/student/patients/` - List assigned patients

### Instructor Endpoints (`/api/instructor/`)
- `GET /api/instructor/reviews/` - List logs to review
- `GET /api/instructor/reviews/pending/` - Pending reviews
- `POST /api/instructor/reviews/{id}/approve/` - Approve log
- `POST /api/instructor/reviews/{id}/reject/` - Reject log
- `GET /api/instructor/students/` - List assigned students

### Admin Endpoints (`/api/admin/`)
- `GET /api/admin/users/` - List all users
- `POST /api/admin/users/invite/` - Invite new user
- `GET /api/admin/institutions/` - List institutions
- `GET /api/admin/patients/` - List patients
- `POST /api/admin/assignments/assign_student_to_preceptor/` - Assign student
- `GET /api/admin/dashboard/stats/` - System statistics

## Testing the Changes

1. **Restart the backend**:
   ```bash
   cd backend
   .\venv\Scripts\python manage.py runserver 8000
   ```

2. **Refresh the frontend**:
   - The frontend should automatically use the new endpoints
   - Try adding a student from the admin panel

3. **Verify**:
   - Login as admin
   - Go to Users tab
   - Click "Add Student"
   - Fill in the form and submit
   - Should work now! ✅

## Common Issues

### Issue: "404 Not Found"
**Solution**: Make sure you're using the new endpoint structure

### Issue: "Request body format error"
**Solution**: Check that field names match:
- Old: `institution` → New: `institution_id`
- Old: `status` → New: (handled automatically)

## Need Help?

Check the comprehensive documentation:
- `backend/README.md` - API documentation
- `backend/ARCHITECTURE.md` - Architecture guide
