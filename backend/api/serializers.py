from rest_framework import serializers
from .models import (
    LogEntries, Profiles, Patients, Institutions, AuthorizedUsers, 
    ClinicalActivities, StudentPatientAssignments, StudentPreceptorAssignments
)
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class InstitutionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Institutions
        fields = '__all__'

class ProfileSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)
    institution_id = serializers.SerializerMethodField()
    
    def get_institution_id(self, obj):
        return str(obj.institution.id) if obj.institution else None
    
    class Meta:
        model = Profiles
        fields = ['id', 'email', 'full_name', 'role', 'created_at', 'institution_id']



class LogEntrySerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    
    class Meta:
        model = LogEntries
        fields = '__all__'
        read_only_fields = ['id', 'submitted_at', 'status', 'feedback', 'student']

class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patients
        fields = '__all__'

class AuthorizedUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuthorizedUsers
        fields = '__all__'

class ClinicalActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = ClinicalActivities
        fields = '__all__'

class StudentPatientAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentPatientAssignments
        fields = '__all__'

class StudentPreceptorAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentPreceptorAssignments
        fields = '__all__'
