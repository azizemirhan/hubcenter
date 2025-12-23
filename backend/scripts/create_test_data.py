import os
import django
import sys

# Setup Django environment
sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.contrib.auth import get_user_model
from apps.organization.models import Group, Company
from apps.accounts.models import UserCompany, Role

User = get_user_model()

def create_data():
    print("Creating test data...")
    
    # 1. Create User
    email = "test@example.com"
    password = "password123"
    user, created = User.objects.get_or_create(email=email)
    if created:
        user.set_password(password)
        user.first_name = "Test"
        user.last_name = "User"
        user.save()
        print(f"User created: {email} / {password}")
    else:
        print(f"User already exists: {email}")

    # 2. Create Group (Holding)
    group, _ = Group.objects.get_or_create(name="Test Holding")
    print(f"Group created: {group.name}")

    # 3. Create Main Company
    main_company, _ = Company.objects.get_or_create(
        group=group,
        name="Test Main Company",
        slug="test-main",
        company_type="main"
    )
    print(f"Main Company created: {main_company.name}")

    # 4. Create Subsidiary
    sub_company, _ = Company.objects.get_or_create(
        group=group,
        name="Test Subsidiary",
        slug="test-sub",
        parent=main_company,
        company_type="subsidiary"
    )
    print(f"Subsidiary created: {sub_company.name}")

    # 5. Assign system roles
    admin_role, _ = Role.objects.get_or_create(company=main_company, name="Admin", is_system=True)
    
    # 6. Assign User to Main Company (Owner)
    UserCompany.objects.get_or_create(
        user=user,
        company=main_company,
        defaults={'is_owner': True, 'is_default': True, 'role': admin_role}
    )
    print("User assigned to Main Company as Owner")

    # 7. Assign User to Subsidiary (Explicit access)
    UserCompany.objects.get_or_create(
        user=user,
        company=sub_company,
        defaults={'is_owner': False, 'role': admin_role}
    )
    print("User assigned to Subsidiary")

if __name__ == "__main__":
    create_data()
