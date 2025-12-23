from django.db import models
from django.conf import settings
from core.models import AuditableModel

class Lead(AuditableModel):
    STATUS_CHOICES = [
        ('new', 'Yeni'), ('contacted', 'İletişime Geçildi'), ('meeting_scheduled', 'Toplantı Planlandı'),
        ('proposal_sent', 'Teklif Gönderildi'), ('negotiation', 'Pazarlık'), ('won', 'Kazanıldı'), ('lost', 'Kaybedildi')
    ]
    SOURCE_CHOICES = [
        ('website', 'Website'), ('whatsapp', 'WhatsApp'), ('referral', 'Referans'),
        ('social_media', 'Sosyal Medya'), ('google_ads', 'Google Ads'), ('other', 'Diğer')
    ]

    company_name = models.CharField(max_length=255)
    contact_person = models.CharField(max_length=255)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20)
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='website')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    expected_value = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    next_contact_date = models.DateField(null=True, blank=True)
    next_action = models.CharField(max_length=255, blank=True)
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.TextField(blank=True)
    lost_reason = models.TextField(blank=True)
    converted_customer = models.ForeignKey('customers.Customer', on_delete=models.SET_NULL, null=True, blank=True)
    converted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'leads'
        ordering = ['-created_at']


class LeadActivity(AuditableModel):
    ACTIVITY_TYPES = [('call', 'Telefon'), ('meeting', 'Toplantı'), ('email', 'Email'), ('whatsapp', 'WhatsApp'), ('proposal', 'Teklif'), ('note', 'Not')]
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='activities')
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_TYPES)
    description = models.TextField()
    contact_date = models.DateTimeField()
    next_action = models.CharField(max_length=255, blank=True)
    next_action_date = models.DateField(null=True, blank=True)

    class Meta:
        db_table = 'lead_activities'
        ordering = ['-contact_date']
