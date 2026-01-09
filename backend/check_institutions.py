import os
import django
import sys

# Set up Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from api.models import Institutions, Profiles, LogEntries

print(f"--- DB DIAGNOSTICS ---")
inst_count = Institutions.objects.count()
print(f"Institutions Count: {inst_count}")

if inst_count == 0:
    print("WARNING: No institutions found. Creating 3 default institutions...")
    Institutions.objects.create(name="City General Hospital")
    Institutions.objects.create(name="County Medical Center")
    Institutions.objects.create(name="Memorial Teaching Hospital")
    print("Created 3 institutions.")
else:
    for i in Institutions.objects.all():
        print(f" - {i.name} (ID: {i.id})")

print(f"Profiles Count: {Profiles.objects.count()}")
print(f"Logs Count: {LogEntries.objects.count()}")
print(f"--- END DIAGNOSTICS ---")
