import os
import django
import sys

sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.accounts.models import User

print("All users in DB:")
for u in User.objects.all():
    print(f"  ID: {u.id}, Email: {u.email}, Is Super: {u.is_superuser}")
    memberships = u.company_memberships.all()
    for m in memberships:
        print(f"    -> Company: {m.company.slug}, Default: {m.is_default}")
