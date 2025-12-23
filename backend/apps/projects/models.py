from django.db import models
from django.conf import settings
from core.models import AuditableModel

class Project(AuditableModel):
    STATUS_CHOICES = [('planning', 'Planlama'), ('in_progress', 'Devam Ediyor'), ('on_hold', 'Beklemede'), ('completed', 'Tamamlandı'), ('cancelled', 'İptal')]

    customer = models.ForeignKey('customers.Customer', on_delete=models.CASCADE, related_name='projects', null=True, blank=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='planning')
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    deadline = models.DateField(null=True, blank=True)
    budget = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=3, default='TRY')
    is_billable = models.BooleanField(default=True)
    manager = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        db_table = 'projects'
        ordering = ['-created_at']


class BoardColumn(AuditableModel):
    name = models.CharField(max_length=100)
    color = models.CharField(max_length=7, default='#6B7280')
    sort_order = models.PositiveIntegerField(default=0)
    is_default = models.BooleanField(default=False)

    class Meta:
        db_table = 'board_columns'
        ordering = ['sort_order']
