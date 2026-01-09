
import os
import django
import uuid
from django.utils import timezone

# Setup Django Environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from django.contrib.auth.models import User
from api.models import Institutions, Profiles, AuthorizedUsers

def create_initial_admin():
    print("🚀 Creating Initial Admin User...")

    # 1. Get Institution
    inst_name = "Stanford Medical School"
    institution, created = Institutions.objects.get_or_create(
        name=inst_name,
        defaults={'id': uuid.uuid4(), 'created_at': timezone.now()}
    )
    if created:
        print(f"   [+] Created Institution: {inst_name}")
    else:
        print(f"   [=] Using Institution: {inst_name}")

    # 2. Admin Credentials
    email = "admin@stanford.edu"
    password = "password123"
    name = "Stanford Admin"

    # 3. Create Django User
    if User.objects.filter(email=email).exists():
        print(f"   [!] User {email} already exists. Resetting password...")
        user = User.objects.get(email=email)
        user.set_password(password)
        user.save()
    else:
        user = User.objects.create_user(username=email, email=email, password=password, first_name=name)
        print(f"   [+] Created Django User: {email}")

    # 4. Create/Update Profile
    profile, created = Profiles.objects.get_or_create(
        email=email,
        defaults={
            'id': uuid.uuid4(),
            'full_name': name,
            'role': 'admin',
            'institution': institution,
            'created_at': timezone.now()
        }
    )
    if not created:
         # Ensure role and institution are correct
         profile.role = 'admin'
         profile.institution = institution
         profile.save()
         print(f"   [=] Updated Profile for {email}")
    else:
         print(f"   [+] Created Profile for {email}")

    # 5. Create/Update AuthorizedUser (to satisfy foreign key/logic checks)
    auth_user, created = AuthorizedUsers.objects.get_or_create(
        email=email,
        defaults={
            'full_name': name,
            'role': 'admin',
            'institution': institution,
            'created_at': timezone.now(),
            'status': 'registered'
        }
    )
    if not created:
        auth_user.status = 'registered'
        auth_user.save()

    print("\n✅ Admin User Ready!")
    print(f"   Email:    {email}")
    print(f"   Password: {password}")
    print(f"   Institution: {inst_name}")
    print("\nYou can now login at the web interface.")

if __name__ == "__main__":
    create_initial_admin()
