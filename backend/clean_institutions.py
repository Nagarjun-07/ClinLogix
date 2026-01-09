
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import Institutions

def clean_institutions():
    from api.models import Profiles, AuthorizedUsers
    targets = ["MIT", "Stanford University", "Harvard Medical School", "Stanford", "Harvard"]
    for name in targets:
        insts = Institutions.objects.filter(name__icontains=name)
        for inst in insts:
             cnt = Profiles.objects.filter(institution=inst).update(institution=None)
             print(f"Disassociated {cnt} profiles from {inst.name}")
             
             cnt_auth = AuthorizedUsers.objects.filter(institution=inst).update(institution=None)
             print(f"Disassociated {cnt_auth} authorized users from {inst.name}")

             inst.delete()
             print(f"Deleted {inst.name}")

if __name__ == '__main__':
    clean_institutions()
