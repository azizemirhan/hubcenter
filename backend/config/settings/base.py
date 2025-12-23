from pathlib import Path
from datetime import timedelta
from decouple import config, Csv

BASE_DIR = Path(__file__).resolve().parent.parent.parent
SECRET_KEY = config('SECRET_KEY', default='django-insecure-change-me')
DEBUG = config('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1', cast=Csv())

DJANGO_APPS = [
    'django.contrib.admin', 'django.contrib.auth', 'django.contrib.contenttypes',
    'django.contrib.sessions', 'django.contrib.messages', 'django.contrib.staticfiles',
]
THIRD_PARTY_APPS = [
    'rest_framework', 'rest_framework_simplejwt', 'rest_framework_simplejwt.token_blacklist',
    'corsheaders', 'django_filters', 'django_otp', 'django_otp.plugins.otp_totp',
    'django_celery_beat', 'django_celery_results', 'drf_spectacular',
]
LOCAL_APPS = [
    'core', 'apps.organization', 'apps.accounts', 'apps.customers', 'apps.leads',
    'apps.domains', 'apps.vault', 'apps.projects', 'apps.tasks', 'apps.seo',
    'apps.finance', 'apps.files', 'apps.whatsapp', 'apps.references',
    'apps.notifications', 'apps.audit',
]
INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware', 'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware', 'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware', 'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django_otp.middleware.OTPMiddleware', 'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware', 'apps.audit.middleware.AuditLogMiddleware',
]

ROOT_URLCONF = 'config.urls'
TEMPLATES = [{'BACKEND': 'django.template.backends.django.DjangoTemplates', 'DIRS': [BASE_DIR / 'templates'], 'APP_DIRS': True, 'OPTIONS': {'context_processors': ['django.template.context_processors.debug', 'django.template.context_processors.request', 'django.contrib.auth.context_processors.auth', 'django.contrib.messages.context_processors.messages']}}]
WSGI_APPLICATION = 'config.wsgi.application'

DATABASES = {'default': {'ENGINE': 'django.db.backends.postgresql', 'NAME': config('DB_NAME', default='crm_db'), 'USER': config('DB_USER', default='postgres'), 'PASSWORD': config('DB_PASSWORD', default='postgres'), 'HOST': config('DB_HOST', default='localhost'), 'PORT': config('DB_PORT', default='5432')}}

AUTH_USER_MODEL = 'accounts.User'
LANGUAGE_CODE = 'tr'
TIME_ZONE = 'Europe/Istanbul'
USE_I18N = True
USE_TZ = True
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': ('rest_framework_simplejwt.authentication.JWTAuthentication',),
    'DEFAULT_PERMISSION_CLASSES': ('rest_framework.permissions.IsAuthenticated',),
    'DEFAULT_PAGINATION_CLASS': 'core.pagination.StandardResultsSetPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

SIMPLE_JWT = {'ACCESS_TOKEN_LIFETIME': timedelta(hours=1), 'REFRESH_TOKEN_LIFETIME': timedelta(days=7), 'ROTATE_REFRESH_TOKENS': True, 'BLACKLIST_AFTER_ROTATION': True}
CORS_ALLOWED_ORIGINS = config('CORS_ALLOWED_ORIGINS', default='http://localhost:3000', cast=Csv())
CORS_ALLOW_CREDENTIALS = True
CELERY_BROKER_URL = config('REDIS_URL', default='redis://localhost:6379/0')
CELERY_RESULT_BACKEND = 'django-db'
CELERY_TIMEZONE = TIME_ZONE
VAULT_ENCRYPTION_KEY = config('VAULT_ENCRYPTION_KEY', default='')

# Google Drive Ayarları
GOOGLE_DRIVE_CREDENTIALS_PATH = BASE_DIR / 'credentials' / 'google-service-account.json'
GOOGLE_DRIVE_FOLDER_ID = '11FMbGh_Tm-QqBW6g7talweW5zNAgLcyH'

# Google Drive OAuth 2.0
GOOGLE_OAUTH_CREDENTIALS_PATH = BASE_DIR / 'credentials' / 'oauth-client.json'
FRONTEND_URL = 'http://localhost:3001'