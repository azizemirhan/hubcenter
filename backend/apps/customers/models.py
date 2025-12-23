from django.db import models
from django.conf import settings
from core.models import AuditableModel

class Customer(AuditableModel):
    STATUS_CHOICES = [('active', 'Aktif'), ('inactive', 'Pasif'), ('suspended', 'Askıya Alındı')]
    PRIORITY_CHOICES = [('low', 'Düşük'), ('normal', 'Normal'), ('high', 'Yüksek'), ('vip', 'VIP')]
    SOURCE_CHOICES = [
        ('website', 'Web Sitesi'),
        ('referral', 'Referans'),
        ('social_media', 'Sosyal Medya'),
        ('google_ads', 'Google Ads'),
        ('cold_call', 'Soğuk Arama'),
        ('event', 'Etkinlik/Fuar'),
        ('other', 'Diğer'),
    ]
    INDUSTRY_CHOICES = [
        ('technology', 'Teknoloji'),
        ('healthcare', 'Sağlık'),
        ('education', 'Eğitim'),
        ('retail', 'Perakende'),
        ('manufacturing', 'Üretim'),
        ('construction', 'İnşaat'),
        ('food', 'Gıda'),
        ('tourism', 'Turizm'),
        ('finance', 'Finans'),
        ('real_estate', 'Gayrimenkul'),
        ('automotive', 'Otomotiv'),
        ('media', 'Medya/Reklam'),
        ('legal', 'Hukuk'),
        ('consulting', 'Danışmanlık'),
        ('other', 'Diğer'),
    ]

    # Basic Info
    company_name = models.CharField(max_length=255, verbose_name='Firma Adı')
    contact_person = models.CharField(max_length=255, verbose_name='Yetkili Kişi')
    title = models.CharField(max_length=100, blank=True, verbose_name='Ünvan')
    email = models.EmailField(verbose_name='Email')
    secondary_email = models.EmailField(blank=True, verbose_name='İkinci Email')
    phone = models.CharField(max_length=20, verbose_name='Telefon')
    secondary_phone = models.CharField(max_length=20, blank=True, verbose_name='İkinci Telefon')
    
    # Address
    address = models.TextField(blank=True, verbose_name='Adres')
    city = models.CharField(max_length=100, blank=True, verbose_name='Şehir')
    district = models.CharField(max_length=100, blank=True, verbose_name='İlçe')
    postal_code = models.CharField(max_length=10, blank=True, verbose_name='Posta Kodu')
    country = models.CharField(max_length=100, blank=True, default='Türkiye', verbose_name='Ülke')
    
    # Tax & Legal
    tax_number = models.CharField(max_length=20, blank=True, verbose_name='Vergi Numarası')
    tax_office = models.CharField(max_length=100, blank=True, verbose_name='Vergi Dairesi')
    trade_registry_no = models.CharField(max_length=50, blank=True, verbose_name='Ticaret Sicil No')
    mersis_no = models.CharField(max_length=20, blank=True, verbose_name='MERSİS No')
    
    # Business Info
    sector = models.CharField(max_length=100, blank=True, verbose_name='Sektör')
    industry = models.CharField(max_length=50, choices=INDUSTRY_CHOICES, blank=True, verbose_name='Sektör Kategorisi')
    website = models.URLField(blank=True, verbose_name='Web Sitesi')
    employee_count = models.PositiveIntegerField(null=True, blank=True, verbose_name='Çalışan Sayısı')
    annual_revenue = models.CharField(max_length=50, blank=True, verbose_name='Yıllık Ciro')
    
    # Social Media
    facebook = models.URLField(blank=True, verbose_name='Facebook')
    instagram = models.CharField(max_length=100, blank=True, verbose_name='Instagram')
    linkedin = models.URLField(blank=True, verbose_name='LinkedIn')
    twitter = models.CharField(max_length=100, blank=True, verbose_name='Twitter/X')
    
    # CRM Fields
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active', verbose_name='Durum')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='normal', verbose_name='Öncelik')
    source = models.CharField(max_length=50, choices=SOURCE_CHOICES, blank=True, verbose_name='Müşteri Kaynağı')
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='assigned_customers',
        verbose_name='Sorumlu Kişi'
    )
    
    # Service & Contract
    has_seo_service = models.BooleanField(default=False, verbose_name='SEO Hizmeti')
    has_hosting_service = models.BooleanField(default=False, verbose_name='Hosting Hizmeti')
    has_social_media_service = models.BooleanField(default=False, verbose_name='Sosyal Medya Yönetimi')
    has_ads_service = models.BooleanField(default=False, verbose_name='Reklam Yönetimi')
    has_web_design_service = models.BooleanField(default=False, verbose_name='Web Tasarım')
    
    contract_start_date = models.DateField(null=True, blank=True, verbose_name='Sözleşme Başlangıç')
    contract_end_date = models.DateField(null=True, blank=True, verbose_name='Sözleşme Bitiş')
    monthly_fee = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='Aylık Ücret')
    payment_day = models.PositiveSmallIntegerField(null=True, blank=True, verbose_name='Ödeme Günü')
    
    # Additional
    notes = models.TextField(blank=True, verbose_name='Notlar')
    tags = models.CharField(max_length=500, blank=True, verbose_name='Etiketler')
    logo = models.ImageField(upload_to='customer_logos/', blank=True, null=True, verbose_name='Logo')
    birth_date = models.DateField(null=True, blank=True, verbose_name='Doğum Tarihi')

    class Meta:
        db_table = 'customers'
        ordering = ['company_name']
        verbose_name = 'Müşteri'
        verbose_name_plural = 'Müşteriler'

    def __str__(self):
        return self.company_name



class CustomerContact(AuditableModel):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='contacts')
    name = models.CharField(max_length=255)
    title = models.CharField(max_length=100, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    is_primary = models.BooleanField(default=False)

    class Meta:
        db_table = 'customer_contacts'


class CustomerNote(AuditableModel):
    NOTE_TYPES = [('call', 'Telefon'), ('meeting', 'Toplantı'), ('email', 'Email'), ('whatsapp', 'WhatsApp'), ('note', 'Not')]
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='communication_notes')
    note_type = models.CharField(max_length=20, choices=NOTE_TYPES, default='note')
    content = models.TextField()
    contact_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'customer_notes'
        ordering = ['-contact_date']
