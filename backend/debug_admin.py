
import os
import django
from django.conf import settings

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from django.contrib.auth.models import User

def check_admin():
    print("Checking specific admin user...")
    try:
        u = User.objects.get(email="admin@stanford.edu")
        print(f"User Found: {u.username}")
        if u.check_password("password123"):
            print("✅ Password is correct")
        else:
            print("❌ Password is INCORRECT")
        print(f"Active: {u.is_active}")
    except User.DoesNotExist:
        print("❌ User not found")

if __name__ == "__main__":
    check_admin()
