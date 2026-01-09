import os
import django
import uuid

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import Institutions
from django.utils import timezone

DEFAULT_INSTITUTIONS = [
    "Apollo Hospital",
    "Jayadeva Hospital",
    "Narayana Health"
]

def seed_institutions():
    print("🌱 Seeding Institutions...")
    created_count = 0
    
    for name in DEFAULT_INSTITUTIONS:
        # Check if exists (case-insensitive)
        if not Institutions.objects.filter(name__iexact=name).exists():
            Institutions.objects.create(
                id=uuid.uuid4(),
                name=name,
                created_at=timezone.now()
            )
            print(f"   [+] Created: {name}")
            created_count += 1
        else:
            print(f"   [ ] Already exists: {name}")

    print(f"✅ Seeding Complete. Added {created_count} new institutions.")

if __name__ == '__main__':
    seed_institutions()
