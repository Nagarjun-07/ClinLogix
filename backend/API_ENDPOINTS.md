# Main API Endpoints

This document outlines the core API endpoints available in the system, organized by user role.

## 🔑 Authentication & Core

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/token/` | `POST` | **Login**. Obtain JWT Access and Refresh tokens. |
| `/api/token/refresh/` | `POST` | **Refresh Token**. Get a new access token using a refresh token. |
| `/api/me/` | `GET` | **My Profile**. Get the currently authenticated user's profile. |
| `/api/register/` | `POST` | **Register**. Register a user account (requires prior invitation). |

---

## 👨‍🎓 Student Endpoints
*Base URL: `/api/student/`*

| Endpoint | Method | Description |
|----------|--------|-------------|
| `logs/` | `GET` | **List Logs**. Get all clinical log entries for the current student. |
| `logs/` | `POST` | **Create Log**. Submit a new clinical log entry. |
| `logs/{id}/` | `GET, PUT, PATCH` | **Manage Log**. View or update a specific log entry. |
| `logs/stats/` | `GET` | **Statistics**. Get summary stats (hours, total entries, etc.). |
| `logs/preceptor/` | `GET` | **My Preceptor**. Get the currently assigned preceptor details. |
| `patients/` | `GET` | **My Patients**. List patients assigned to the student. |

---

## 👨‍🏫 Instructor Endpoints
*Base URL: `/api/instructor/`*

| Endpoint | Method | Description |
|----------|--------|-------------|
| `reviews/` | `GET` | **List Reviews**. Get log entries from assigned students. |
| `reviews/pending/` | `GET` | **Pending Reviews**. Get only logs waiting for approval. |
| `reviews/{id}/approve/` | `POST` | **Approve**. Approve a specific log entry (requires feedback). |
| `reviews/{id}/reject/` | `POST` | **Reject**. Reject a specific log entry (requires feedback). |
| `students/` | `GET` | **My Students**. List students assigned to this instructor. |

---

## 🛡️ Admin Endpoints
*Base URL: `/api/admin/`*

### User Management
| Endpoint | Method | Description |
|----------|--------|-------------|
| `users/` | `GET` | **List Users**. List all authorized users in the system. |
| `users/invite/` | `POST` | **Invite User**. Invite a new Student or Instructor. |
| `users/delete/{email}/` | `DELETE` | **Delete User**. Remove a user from the system. |
| `users/update/{email}/` | `PATCH` | **Update User**. Update user details. |

### Assignments & Data
| Endpoint | Method | Description |
|----------|--------|-------------|
| `files/assignments/assign_student_to_preceptor/` | `POST` | **Assign Preceptor**. Link a student to an instructor. |
| `assignments/preceptor_stats/` | `GET` | **Preceptor Loads**. View current student load for each preceptor. |
| `institutions/` | `GET, POST` | **Institutions**. Manage institution records. |
| `patients/` | `GET, POST` | **Patients**. Manage master patient records. |
| `dashboard/stats/` | `GET` | **System Stats**. Overall system metrics for the dashboard. |
