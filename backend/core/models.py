from django.db import models
from django.conf import settings
import uuid

class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        abstract = True

class UUIDModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    class Meta:
        abstract = True

class CompanyOwnedModel(TimeStampedModel):
    company = models.ForeignKey('organization.Company', on_delete=models.CASCADE, related_name='%(class)s_items')
    class Meta:
        abstract = True

class AuditableModel(CompanyOwnedModel):
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='%(class)s_created')
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='%(class)s_updated')
    class Meta:
        abstract = True
