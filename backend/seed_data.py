import os
import django
import uuid
from django.utils import timezone

# Setup Django Environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from api.models import Institutions

ORG_NAMES = ["Stanford Medical School", "Harvard Medical School", "MIT Health"]

def seed_institutions():
    print(" Seeding Institutions...")
    created_count = 0
    for name in ORG_NAMES:
        # Check if exists (case insensitive)
        if not Institutions.objects.filter(name__iexact=name).exists():
            Institutions.objects.create(
                id=uuid.uuid4(),
                name=name,
                created_at=timezone.now()
            )
            print(f"   [+] Created: {name}")
            created_count += 1
        else:
            print(f"   [=] Exists:  {name}")
    
    print(f"Seeding Complete. Added {created_count} new institutions.")

if __name__ == "__main__":
    seed_institutions()
