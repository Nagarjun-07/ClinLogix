
import os
import django
from django.conf import settings

# Setup Django Environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from django.contrib.auth.models import User
from api.models import Profiles, AuthorizedUsers, Institutions

def verify_data():
    print("🔍 Diagnostic Check:")
    
    # Check User
    users = User.objects.all()
    print(f"\n1. Django Users ({users.count()}):")
    for u in users:
        print(f"   - ID: {u.id}, Username: '{u.username}', Email: '{u.email}', Active: {u.is_active}")
        if u.check_password('password123'):
             print(f"     ✅ Password 'password123' checks out.")
        else:
             print(f"     ❌ Password 'password123' INVALID.")

    # Check Profiles
    profiles = Profiles.objects.all()
    print(f"\n2. Profiles ({profiles.count()}):")
    for p in profiles:
        print(f"   - Email: '{p.email}', Role: {p.role}, Institution: {p.institution.name if p.institution else 'None'}")

    # Check AuthorizedUsers
    auth_users = AuthorizedUsers.objects.all()
    print(f"\n3. AuthorizedUsers ({auth_users.count()}):")
    for a in auth_users:
        print(f"   - Email: '{a.email}', Role: {a.role}, Status: {a.status}")

    # Check Institutions
    insts = Institutions.objects.all()
    print(f"\n4. Institutions ({insts.count()}):")
    for i in insts:
        print(f"   - Name: {i.name}")

if __name__ == "__main__":
    verify_data()
