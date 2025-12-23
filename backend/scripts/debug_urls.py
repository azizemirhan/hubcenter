import os
import django
from django.conf import settings
import sys

# Setup Django environment
sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.organization.urls import router
from django.urls import get_resolver

print("Router URLs:")
for url in router.urls:
    print(url)

print("\nFull URL Resolver:")
resolver = get_resolver()
# This might be too verbose, but let's try to specifically look for organization
# We can just iterate router.urls, that suffices since we know it's under /api/v1/organization/ (from project structure likely)
