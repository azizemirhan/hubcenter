from django.db import models
from core.models import AuditableModel

class Credential(AuditableModel):
    CREDENTIAL_TYPES = [
        ('site_admin', 'Site Yönetim Paneli'), ('hosting', 'Hosting Girişi'), ('cpanel', 'cPanel'),
        ('ftp', 'FTP Bilgileri'), ('gmail', 'Gmail/Google'), ('social_media', 'Sosyal Medya'),
        ('database', 'Veritabanı'), ('api_key', 'API Anahtarı'), ('other', 'Diğer')
    ]

    customer = models.ForeignKey('customers.Customer', on_delete=models.CASCADE, related_name='credentials')
    credential_type = models.CharField(max_length=20, choices=CREDENTIAL_TYPES)
    title = models.CharField(max_length=255)
    url = models.URLField(blank=True)
    username = models.CharField(max_length=255)
    password_encrypted = models.TextField()
    notes = models.TextField(blank=True)
    last_viewed_at = models.DateTimeField(null=True, blank=True)
    last_viewed_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True)
    view_count = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'credentials'


class MailAccount(AuditableModel):
    customer = models.ForeignKey('customers.Customer', on_delete=models.CASCADE, related_name='mail_accounts')
    email = models.EmailField()
    password_encrypted = models.TextField()
    smtp_server = models.CharField(max_length=255)
    smtp_port = models.PositiveIntegerField(default=587)
    smtp_security = models.CharField(max_length=10, default='TLS')
    imap_server = models.CharField(max_length=255, blank=True)
    imap_port = models.PositiveIntegerField(default=993)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'mail_accounts'
