import os
import django
import sys

# Setup Django environment
sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.accounts.models import User
from apps.organization.models import Company

try:
    user = User.objects.get(email='test@example.com')
    print(f"User found: {user.email} (ID: {user.id})")
    
    print("\nUser Memberships:")
    for membership in user.company_memberships.all():
        print(f" - Company: {membership.company.name}, Slug: {membership.company.slug}, ID: {membership.company.id}, Default: {membership.is_default}")

    print("\nChecking 'test-main' slug:")
    try:
        c = Company.objects.get(slug='test-main')
        print(f"Found Company: {c.name} (ID: {c.id})")
        
        # Check manual filtering
        ids = user.company_memberships.values_list('company_id', flat=True)
        print(f"User Company IDs: {list(ids)}")
        
        is_visible = Company.objects.filter(id__in=ids, slug='test-main').exists()
        print(f"Is visible via get_queryset logic? {is_visible}")
        
    except Company.DoesNotExist:
        print("Company with slug 'test-main' DOES NOT EXIST.")

except User.DoesNotExist:
    print("User test@example.com not found.")
