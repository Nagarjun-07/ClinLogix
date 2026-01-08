"""
API URL Configuration - organized by user roles
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MeView,
    RegisterView,
    # Student views
    StudentLogViewSet,
    StudentPatientViewSet,
    # Instructor views
    InstructorReviewViewSet,
    InstructorStudentViewSet,
    # Admin views
    AdminUserManagementViewSet,
    AdminInstitutionViewSet,
    AdminPatientViewSet,
    AdminAssignmentViewSet,
    AdminDashboardViewSet,
    # Profile views
    ProfileViewSet,
)

# Create routers for different user roles
student_router = DefaultRouter()
student_router.register(r'logs', StudentLogViewSet, basename='student-logs')
student_router.register(r'patients', StudentPatientViewSet, basename='student-patients')

instructor_router = DefaultRouter()
instructor_router.register(r'reviews', InstructorReviewViewSet, basename='instructor-reviews')
instructor_router.register(r'students', InstructorStudentViewSet, basename='instructor-students')

admin_router = DefaultRouter()
admin_router.register(r'users', AdminUserManagementViewSet, basename='admin-users')
admin_router.register(r'institutions', AdminInstitutionViewSet, basename='admin-institutions')
admin_router.register(r'patients', AdminPatientViewSet, basename='admin-patients')
admin_router.register(r'assignments', AdminAssignmentViewSet, basename='admin-assignments')
admin_router.register(r'dashboard', AdminDashboardViewSet, basename='admin-dashboard')

urlpatterns = [
    # Current user profile
    path('me/', MeView.as_view(), name='me'),
    
    # Registration endpoint (for invited users)
    path('register/', RegisterView.as_view(), name='register'),
    
    # Profiles (registered users) - for backward compatibility
    path('profiles/', include([
        path('', ProfileViewSet.as_view({'get': 'list'}), name='profile-list'),
        path('<uuid:pk>/', ProfileViewSet.as_view({'get': 'retrieve'}), name='profile-detail'),
    ])),
    
    # Student endpoints
    path('student/', include(student_router.urls)),
    
    # Instructor endpoints
    path('instructor/', include(instructor_router.urls)),
    
    # Admin endpoints
    path('admin/', include(admin_router.urls)),
]
