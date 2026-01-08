# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models
import uuid


class AuditLogs(models.Model):
    id = models.UUIDField(primary_key=True)
    actor_id = models.UUIDField(blank=True, null=True)
    action = models.TextField()
    entity_type = models.TextField()
    entity_id = models.UUIDField()
    metadata = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'audit_logs'


class AuthorizedUsers(models.Model):
    email = models.TextField(primary_key=True)
    role = models.TextField(db_index=True)
    full_name = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField()
    invited_by = models.UUIDField(blank=True, null=True)
    institution = models.ForeignKey('Institutions', models.DO_NOTHING, blank=True, null=True)
    status = models.TextField(blank=True, null=True, db_index=True)

    class Meta:
        managed = False
        db_table = 'authorized_users'


class ClinicalActivities(models.Model):
    id = models.UUIDField(primary_key=True)
    name = models.TextField()
    category = models.TextField(blank=True, null=True)
    institution = models.ForeignKey('Institutions', models.DO_NOTHING, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'clinical_activities'


class Institutions(models.Model):
    id = models.UUIDField(primary_key=True)
    name = models.TextField()
    created_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'institutions'


class LogEntries(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey('Profiles', models.DO_NOTHING)
    date = models.DateField(db_index=True)
    location = models.TextField()
    specialty = models.TextField(db_index=True)
    hours = models.DecimalField(max_digits=5, decimal_places=2)
    activities = models.TextField(blank=True, null=True)
    learning_objectives = models.TextField(blank=True, null=True)
    reflection = models.TextField(blank=True, null=True)
    supervisor_name = models.TextField(blank=True, null=True)
    status = models.TextField(blank=True, null=True, db_index=True)
    feedback = models.TextField(blank=True, null=True)
    submitted_at = models.DateTimeField(auto_now_add=True, db_index=True)
    patient = models.ForeignKey('Patients', models.DO_NOTHING, blank=True, null=True)
    is_locked = models.BooleanField(blank=True, null=True)
    patients_seen = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'log_entries'


class Patients(models.Model):
    id = models.UUIDField(primary_key=True)
    reference_id = models.TextField()
    age_group = models.TextField(blank=True, null=True)
    gender = models.TextField(blank=True, null=True)
    clinical_category = models.TextField(blank=True, null=True)
    institution = models.ForeignKey(Institutions, models.DO_NOTHING, blank=True, null=True)
    created_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'patients'
        unique_together = (('reference_id', 'institution'),)


class Profiles(models.Model):
    id = models.UUIDField(primary_key=True)
    email = models.TextField(blank=True, null=True, db_index=True)
    full_name = models.TextField(blank=True, null=True, db_index=True)
    role = models.TextField(blank=True, null=True, db_index=True)
    created_at = models.DateTimeField()
    institution = models.ForeignKey(Institutions, models.DO_NOTHING, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'profiles'


class StudentPatientAssignments(models.Model):
    id = models.UUIDField(primary_key=True)
    student = models.ForeignKey(Profiles, models.DO_NOTHING)
    patient = models.ForeignKey(Patients, models.DO_NOTHING)
    assigned_by = models.ForeignKey(Profiles, models.DO_NOTHING, db_column='assigned_by', related_name='studentpatientassignments_assigned_by_set', blank=True, null=True)
    assigned_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'student_patient_assignments'
        unique_together = (('student', 'patient'),)


class StudentPreceptorAssignments(models.Model):
    id = models.UUIDField(primary_key=True)
    student = models.ForeignKey(Profiles, models.DO_NOTHING)
    preceptor = models.ForeignKey(Profiles, models.DO_NOTHING, related_name='studentpreceptorassignments_preceptor_set')
    assigned_at = models.DateTimeField()
    status = models.TextField(blank=True, null=True, db_index=True)

    class Meta:
        managed = False
        db_table = 'student_preceptor_assignments'
        unique_together = (('student', 'preceptor'),)
