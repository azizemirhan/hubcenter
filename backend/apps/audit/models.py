from django.db import models
from django.conf import settings
from core.models import TimeStampedModel

class AuditLog(TimeStampedModel):
    ACTION_CHOICES = [
        ('create', 'Oluşturma'), ('update', 'Güncelleme'), ('delete', 'Silme'), ('view', 'Görüntüleme'),
        ('login', 'Giriş'), ('logout', 'Çıkış'), ('credential_view', 'Şifre Görüntüleme')
    ]

    company = models.ForeignKey('organization.Company', on_delete=models.CASCADE, related_name='audit_logs')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    module = models.CharField(max_length=50)
    record_type = models.CharField(max_length=100)
    record_id = models.PositiveIntegerField(null=True, blank=True)
    record_repr = models.CharField(max_length=255, blank=True)
    old_values = models.JSONField(null=True, blank=True)
    new_values = models.JSONField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)

    class Meta:
        db_table = 'audit_logs'
        ordering = ['-created_at']
        indexes = [models.Index(fields=['company', 'module']), models.Index(fields=['created_at'])]
