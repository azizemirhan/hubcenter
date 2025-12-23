from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from core.models import TimeStampedModel

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email zorunludur')
        user = self.model(email=self.normalize_email(email), **extra_fields)
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    username = None
    email = models.EmailField('email', unique=True)
    phone = models.CharField(max_length=20, blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    two_fa_enabled = models.BooleanField(default=False)
    two_fa_secret = models.CharField(max_length=32, blank=True)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    
    # Google Drive OAuth tokens
    google_drive_token = models.JSONField(null=True, blank=True)
    google_drive_connected = models.BooleanField(default=False)


    objects = UserManager()
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        db_table = 'users'

    def __str__(self):
        return self.get_full_name() or self.email

    @property
    def active_company(self):
        membership = self.company_memberships.filter(is_default=True).first()
        return membership.company if membership else None

    def has_module_permission(self, module, action):
        membership = self.company_memberships.filter(company=self.active_company).first()
        if not membership:
            return False
        if membership.is_owner:
            return True
        return membership.role.role_permissions.filter(permission__code=f"{module}.{action}").exists()


class Role(TimeStampedModel):
    company = models.ForeignKey('organization.Company', on_delete=models.CASCADE, related_name='roles')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_system = models.BooleanField(default=False)

    class Meta:
        db_table = 'roles'
        unique_together = ['company', 'name']


class Permission(models.Model):
    code = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=255)
    module = models.CharField(max_length=50)

    class Meta:
        db_table = 'permissions'


class RolePermission(models.Model):
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='role_permissions')
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE)

    class Meta:
        db_table = 'role_permissions'
        unique_together = ['role', 'permission']


class UserCompany(TimeStampedModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='company_memberships')
    company = models.ForeignKey('organization.Company', on_delete=models.CASCADE, related_name='members')
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True)
    is_owner = models.BooleanField(default=False)
    is_default = models.BooleanField(default=False)
    last_accessed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'user_companies'
        unique_together = ['user', 'company']

    def save(self, *args, **kwargs):
        if self.is_default:
            UserCompany.objects.filter(user=self.user, is_default=True).update(is_default=False)
        super().save(*args, **kwargs)


class LoginHistory(TimeStampedModel):
    STATUS_CHOICES = [('success', 'Başarılı'), ('failed', 'Başarısız'), ('blocked', 'Engellendi')]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='login_history')
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    two_fa_method = models.CharField(max_length=20, blank=True)

    class Meta:
        db_table = 'login_history'
        ordering = ['-created_at']
