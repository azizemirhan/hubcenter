from django.db import models
from django.conf import settings
from core.models import AuditableModel


class SEOPackage(AuditableModel):
    """SEO service package for a customer"""
    STATUS_CHOICES = [
        ('active', 'Aktif'),
        ('paused', 'Duraklatıldı'),
        ('completed', 'Tamamlandı'),
        ('cancelled', 'İptal')
    ]
    PACKAGE_TYPES = [
        ('basic', 'Temel'),
        ('standard', 'Standart'),
        ('premium', 'Premium'),
        ('enterprise', 'Kurumsal')
    ]

    customer = models.ForeignKey('customers.Customer', on_delete=models.CASCADE, related_name='seo_packages')
    domain = models.ForeignKey('domains.Domain', on_delete=models.SET_NULL, null=True, blank=True, related_name='seo_packages')
    package_type = models.CharField(max_length=20, choices=PACKAGE_TYPES, default='standard')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    monthly_fee = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='TRY')
    target_keywords = models.TextField(blank=True, help_text="Her satıra bir anahtar kelime")
    notes = models.TextField(blank=True)
    
    class Meta:
        db_table = 'seo_packages'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.customer.company_name} - {self.get_package_type_display()}"


class SEOKeyword(AuditableModel):
    """Tracked keyword for SEO package"""
    package = models.ForeignKey(SEOPackage, on_delete=models.CASCADE, related_name='keywords')
    keyword = models.CharField(max_length=255)
    search_volume = models.PositiveIntegerField(null=True, blank=True)
    difficulty = models.PositiveSmallIntegerField(null=True, blank=True, help_text="1-100 arası zorluk")
    target_position = models.PositiveSmallIntegerField(default=10)
    current_position = models.PositiveSmallIntegerField(null=True, blank=True)
    previous_position = models.PositiveSmallIntegerField(null=True, blank=True)
    last_checked = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'seo_keywords'
        ordering = ['keyword']
        unique_together = ['package', 'keyword']


class SEOReport(AuditableModel):
    """Monthly SEO report"""
    package = models.ForeignKey(SEOPackage, on_delete=models.CASCADE, related_name='reports')
    report_date = models.DateField()
    organic_traffic = models.PositiveIntegerField(null=True, blank=True)
    backlinks_count = models.PositiveIntegerField(null=True, blank=True)
    indexed_pages = models.PositiveIntegerField(null=True, blank=True)
    average_position = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    top_10_keywords = models.PositiveSmallIntegerField(null=True, blank=True)
    top_30_keywords = models.PositiveSmallIntegerField(null=True, blank=True)
    summary = models.TextField(blank=True)
    report_file = models.FileField(upload_to='seo_reports/', blank=True, null=True)
    
    class Meta:
        db_table = 'seo_reports'
        ordering = ['-report_date']
        unique_together = ['package', 'report_date']


class SEOTask(AuditableModel):
    """SEO related task/action"""
    TASK_TYPES = [
        ('on_page', 'On-Page SEO'),
        ('off_page', 'Off-Page SEO'),
        ('technical', 'Teknik SEO'),
        ('content', 'İçerik'),
        ('backlink', 'Backlink'),
        ('other', 'Diğer')
    ]
    STATUS_CHOICES = [
        ('pending', 'Beklemede'),
        ('in_progress', 'Devam Ediyor'),
        ('completed', 'Tamamlandı')
    ]

    package = models.ForeignKey(SEOPackage, on_delete=models.CASCADE, related_name='seo_tasks')
    task_type = models.CharField(max_length=20, choices=TASK_TYPES)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'seo_tasks'
        ordering = ['-created_at']
