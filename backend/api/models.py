# This is an auto-generated Django model module.
# Django created this file automatically from the existing database tables.

# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Ensure each model has a primary key
#   * Set proper on_delete behavior for relations
#   * Remove managed = False if Django should manage tables

# Import Django's model system
from django.db import models

# Import UUID library for generating unique IDs
import uuid


# =======================
# AuditLogs Model
# =======================
class AuditLogs(models.Model):
    # Primary key UUID for each audit log
    id = models.UUIDField(primary_key=True)

    # ID of the user who performed the action
    actor_id = models.UUIDField(blank=True, null=True)

    # Action performed (CREATE, UPDATE, DELETE, etc.)
    action = models.TextField()

    # Type of entity affected (e.g., LogEntry, Patient)
    entity_type = models.TextField()

    # ID of the affected entity
    entity_id = models.UUIDField()

    # Additional metadata stored as JSON
    metadata = models.JSONField(blank=True, null=True)

    # Timestamp when the action was created
    created_at = models.DateTimeField()

    class Meta:
        # Django will NOT manage this table
        managed = False

        # Actual database table name
        db_table = 'audit_logs'


# =======================
# AuthorizedUsers Model
# =======================
class AuthorizedUsers(models.Model):
    # Email is used as the primary key
    email = models.TextField(primary_key=True)

    # Role of the user (admin, student, preceptor)
    role = models.TextField(db_index=True)

    # Full name of the user
    full_name = models.TextField(blank=True, null=True)

    # When the user was created
    created_at = models.DateTimeField()

    # ID of the user who invited this user
    invited_by = models.UUIDField(blank=True, null=True)

    # Institution the user belongs to
    institution = models.ForeignKey('Institutions', models.DO_NOTHING, blank=True, null=True)

    # Current status (active, pending, disabled)
    status = models.TextField(blank=True, null=True, db_index=True)

    class Meta:
        managed = False
        db_table = 'authorized_users'


# =======================
# ClinicalActivities Model
# =======================
class ClinicalActivities(models.Model):
    # Unique ID for activity
    id = models.UUIDField(primary_key=True)

    # Name of the clinical activity
    name = models.TextField()

    # Category of activity
    category = models.TextField(blank=True, null=True)

    # Institution associated with the activity
    institution = models.ForeignKey('Institutions', models.DO_NOTHING, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'clinical_activities'


# =======================
# Institutions Model
# =======================
class Institutions(models.Model):
    # Institution unique ID
    id = models.UUIDField(primary_key=True)

    # Institution name
    name = models.TextField()

    # When the institution was created
    created_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'institutions'


# =======================
# LogEntries Model
# =======================
class LogEntries(models.Model):
    # Primary key generated automatically using UUID
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Student who created the log
    student = models.ForeignKey('Profiles', models.DO_NOTHING)

    # Date of the log entry
    date = models.DateField(db_index=True)

    # Location of the clinical activity
    location = models.TextField()

    # Specialty area (indexed for faster search)
    specialty = models.TextField(db_index=True)

    # Number of hours worked
    hours = models.DecimalField(max_digits=5, decimal_places=2)

    # Activities performed
    activities = models.TextField(blank=True, null=True)

    # Learning objectives
    learning_objectives = models.TextField(blank=True, null=True)

    # Student reflection
    reflection = models.TextField(blank=True, null=True)

    # Supervisor name
    supervisor_name = models.TextField(blank=True, null=True)

    # Status of the log (draft, submitted, approved)
    status = models.TextField(blank=True, null=True, db_index=True)

    # Feedback from supervisor
    feedback = models.TextField(blank=True, null=True)

    # Time when log was submitted
    submitted_at = models.DateTimeField(auto_now_add=True, db_index=True)

    # Related patient
    patient = models.ForeignKey('Patients', models.DO_NOTHING, blank=True, null=True)

    # Whether the log is locked
    is_locked = models.BooleanField(blank=True, null=True)

    # Number of patients seen
    patients_seen = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'log_entries'


# =======================
# Patients Model
# =======================
class Patients(models.Model):
    # Unique patient ID
    id = models.UUIDField(primary_key=True)

    # External or reference ID (FHIR or hospital ID)
    reference_id = models.TextField()

    # Age group of patient
    age_group = models.TextField(blank=True, null=True)

    # Gender of patient
    gender = models.TextField(blank=True, null=True)

    # Clinical category
    clinical_category = models.TextField(blank=True, null=True)

    # Institution patient belongs to
    institution = models.ForeignKey(Institutions, models.DO_NOTHING, blank=True, null=True)

    # When patient record was created
    created_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'patients'

        # Combination of reference_id and institution must be unique
        unique_together = (('reference_id', 'institution'),)


# =======================
# Profiles Model
# =======================
class Profiles(models.Model):
    # Profile unique ID
    id = models.UUIDField(primary_key=True)

    # Email address
    email = models.TextField(blank=True, null=True, db_index=True)

    # Full name
    full_name = models.TextField(blank=True, null=True, db_index=True)

    # Role (student, preceptor, admin)
    role = models.TextField(blank=True, null=True, db_index=True)

    # Profile creation date
    created_at = models.DateTimeField()

    # Associated institution
    institution = models.ForeignKey(Institutions, models.DO_NOTHING, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'profiles'


# =======================
# StudentPatientAssignments Model
# =======================
class StudentPatientAssignments(models.Model):
    # Assignment unique ID
    id = models.UUIDField(primary_key=True)

    # Student profile
    student = models.ForeignKey(Profiles, models.DO_NOTHING)

    # Assigned patient
    patient = models.ForeignKey(Patients, models.DO_NOTHING)

    # Who assigned the patient
    assigned_by = models.ForeignKey(
        Profiles,
        models.DO_NOTHING,
        db_column='assigned_by',
        related_name='studentpatientassignments_assigned_by_set',
        blank=True,
        null=True
    )

    # Assignment timestamp
    assigned_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'student_patient_assignments'

        # A student cannot be assigned the same patient twice
        unique_together = (('student', 'patient'),)


# =======================
# StudentPreceptorAssignments Model
# =======================
class StudentPreceptorAssignments(models.Model):
    # Assignment unique ID
    id = models.UUIDField(primary_key=True)

    # Student profile
    student = models.ForeignKey(Profiles, models.DO_NOTHING)

    # Preceptor profile
    preceptor = models.ForeignKey(
        Profiles,
        models.DO_NOTHING,
        related_name='studentpreceptorassignments_preceptor_set'
    )

    # Assignment date
    assigned_at = models.DateTimeField()

    # Assignment status
    status = models.TextField(blank=True, null=True, db_index=True)

    class Meta:
        managed = False
        db_table = 'student_preceptor_assignments'

        # A student-preceptor pair must be unique
        unique_together = (('student', 'preceptor'),)