from django.db import models
from core.models import AuditableModel

class Domain(AuditableModel):
    customer = models.ForeignKey('customers.Customer', on_delete=models.CASCADE, related_name='domains')
    domain_name = models.CharField(max_length=255)
    registrar = models.CharField(max_length=100)
    register_date = models.DateField()
    expire_date = models.DateField()
    auto_renew = models.BooleanField(default=True)
    dns_provider = models.CharField(max_length=100, blank=True)
    nameservers = models.TextField(blank=True)
    ssl_provider = models.CharField(max_length=100, blank=True)
    ssl_expire_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    notify_30_days = models.BooleanField(default=True)
    notify_15_days = models.BooleanField(default=True)
    notify_7_days = models.BooleanField(default=True)

    class Meta:
        db_table = 'domains'
        ordering = ['expire_date']

    @property
    def days_until_expiry(self):
        from django.utils import timezone
        return (self.expire_date - timezone.now().date()).days


class Hosting(AuditableModel):
    customer = models.ForeignKey('customers.Customer', on_delete=models.CASCADE, related_name='hostings')
    provider = models.CharField(max_length=100)
    plan_name = models.CharField(max_length=100)
    server_ip = models.GenericIPAddressField(blank=True, null=True)
    server_location = models.CharField(max_length=100, blank=True)
    disk_space = models.CharField(max_length=50, blank=True)
    bandwidth = models.CharField(max_length=50, blank=True)
    start_date = models.DateField()
    expire_date = models.DateField()
    monthly_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=3, default='TRY')
    cpanel_url = models.URLField(blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'hostings'
        ordering = ['expire_date']
