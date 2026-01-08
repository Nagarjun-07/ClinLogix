# Django Backend - Enterprise Architecture

## 🏗️ Project Structure

```
backend/
├── api/
│   ├── views/
│   │   ├── student/
│   │   │   └── __init__.py          # Student-specific views
│   │   ├── instructor/
│   │   │   └── __init__.py          # Instructor-specific views
│   │   └── admin/
│   │       └── __init__.py          # Admin-specific views
│   ├── models.py                    # Database models (auto-generated from Supabase)
│   ├── serializers.py               # DRF serializers
│   ├── permissions.py               # Custom permission classes
│   ├── mixins.py                    # Reusable view mixins
│   ├── exceptions.py                # Custom exception classes
│   ├── constants.py                 # Application constants
│   ├── utils.py                     # Utility functions
│   ├── views.py                     # Main views (imports from role folders)
│   └── urls.py                      # API URL routing
├── core/
│   ├── settings.py                  # Django settings
│   └── urls.py                      # Project URLs
├── venv/                            # Virtual environment
├── manage.py                        # Django management script
└── README.md                        # API documentation
```

## 🎯 Design Patterns & Best Practices

### 1. **Separation of Concerns**
- **Models**: Database schema (auto-generated from Supabase)
- **Serializers**: Data transformation and validation
- **Views**: Business logic and request handling
- **Permissions**: Access control logic
- **Mixins**: Reusable functionality
- **Utils**: Helper functions

### 2. **Role-Based Access Control (RBAC)**
```python
# Custom permission classes
- IsStudent: Only students can access
- IsInstructor: Only instructors can access
- IsAdmin: Only admins can access
- IsOwnerOrReadOnly: Object-level permissions
- IsAssignedInstructor: Relationship-based permissions
```

### 3. **Reusable Mixins**
```python
- UserProfileMixin: Get current user's profile
- FilterByUserMixin: Auto-filter by user
- AuditMixin: Automatic audit logging
- ResponseMixin: Standardized API responses
- PaginationMixin: Consistent pagination
```

### 4. **Custom Exceptions**
```python
- ProfileNotFoundError
- UnauthorizedAccessError
- InvalidRoleError
- DuplicateEntryError
- ValidationError
- ResourceNotFoundError
- BusinessLogicError
```

### 5. **Constants Management**
All magic strings and values are centralized in `constants.py`:
- User roles
- Status values
- Messages
- Pagination settings
- Date/time formats

### 6. **Utility Functions**
Common operations extracted to `utils.py`:
- Profile management
- Role checking
- Audit logging
- Email notifications
- Data validation
- Calculations

## 📡 API Architecture

### Endpoint Structure
```
/api/
├── token/                           # JWT authentication
├── token/refresh/                   # Token refresh
├── me/                              # Current user profile
├── student/
│   ├── logs/                        # Student's log entries
│   ├── logs/stats/                  # Statistics
│   └── patients/                    # Assigned patients
├── instructor/
│   ├── reviews/                     # Logs to review
│   ├── reviews/pending/             # Pending reviews
│   ├── reviews/{id}/approve/        # Approve log
│   ├── reviews/{id}/reject/         # Reject log
│   └── students/                    # Assigned students
└── admin/
    ├── users/                       # User management
    ├── users/invite/                # Invite users
    ├── institutions/                # Institution management
    ├── patients/                    # Patient management
    ├── assignments/                 # Assignment management
    ├── assignments/assign_student_to_preceptor/
    ├── assignments/assign_patient_to_student/
    └── dashboard/stats/             # System statistics
```

## 🔐 Security Features

### 1. **JWT Authentication**
- Access tokens (30 min expiry)
- Refresh tokens (7 days expiry)
- Custom email-based authentication backend

### 2. **Permission System**
- Role-based permissions
- Object-level permissions
- Relationship-based permissions

### 3. **Data Isolation**
- Students see only their own data
- Instructors see only assigned students' data
- Admins have full access

### 4. **Audit Trail**
- All critical actions logged
- Actor, action, entity tracking
- Metadata for context

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": { ... }
}
```

## 🔄 Transaction Management

Critical operations use database transactions:
```python
@transaction.atomic
def create_assignment(self, request):
    # All DB operations succeed or fail together
    pass
```

## 📧 Notification System

Email notifications for:
- User invitations
- Log approvals
- Log rejections
- Assignment notifications

## 🧪 Code Quality Standards

### 1. **Docstrings**
Every class and method has comprehensive docstrings:
```python
def approve(self, request, pk=None):
    """
    Approve a log entry
    
    Request body:
        - feedback: Optional feedback message
    
    Returns:
        Success response with updated log entry
    """
```

### 2. **Type Hints** (Future Enhancement)
Can be added for better IDE support

### 3. **Error Handling**
- Custom exceptions for different scenarios
- Proper HTTP status codes
- Descriptive error messages

### 4. **DRY Principle**
- Mixins for common functionality
- Utils for shared operations
- Constants for repeated values

## 🚀 Performance Optimizations

### 1. **Query Optimization**
- Select related for foreign keys
- Prefetch related for many-to-many
- Indexed fields for fast lookups

### 2. **Caching** (Future Enhancement)
- Redis for session storage
- Cache frequently accessed data

### 3. **Pagination**
- Consistent page sizes
- Configurable limits

## 📝 Development Workflow

### 1. **Adding New Endpoints**
1. Create serializer in `serializers.py`
2. Create view in appropriate role folder
3. Add permissions if needed
4. Register route in `urls.py`
5. Update documentation

### 2. **Adding New Permissions**
1. Create class in `permissions.py`
2. Inherit from `BasePermission`
3. Implement `has_permission()` or `has_object_permission()`

### 3. **Adding New Utilities**
1. Add function to `utils.py`
2. Add docstring
3. Import where needed

## 🔧 Configuration

### Environment Variables
```env
DATABASE_URL=postgresql://...
SECRET_KEY=...
DEBUG=True/False
ALLOWED_HOSTS=...
```

### Settings Highlights
- JWT configuration
- CORS settings
- Database connection
- Email configuration
- Authentication backends

## 📚 Further Reading

- [Django REST Framework](https://www.django-rest-framework.org/)
- [Django Best Practices](https://django-best-practices.readthedocs.io/)
- [REST API Design](https://restfulapi.net/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
