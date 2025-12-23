from django.db import models
from django.utils.text import slugify
from core.models import TimeStampedModel

class Group(TimeStampedModel):
    """Holding/Grup seviyesi"""
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    logo = models.ImageField(upload_to='groups/logos/', blank=True, null=True)
    settings = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'groups'
        verbose_name = 'Grup'

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Company(TimeStampedModel):
    """Ana şirket veya alt şirket"""
    COMPANY_TYPES = [('main', 'Ana Şirket'), ('subsidiary', 'Alt Şirket')]

    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='companies')
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='subsidiaries')
    company_type = models.CharField(max_length=20, choices=COMPANY_TYPES, default='main')
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255)
    tax_number = models.CharField(max_length=20, blank=True)
    tax_office = models.CharField(max_length=100, blank=True)
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    website = models.URLField(blank=True)
    logo = models.ImageField(upload_to='companies/logos/', blank=True, null=True)
    color_primary = models.CharField(max_length=7, default='#3B82F6')
    color_secondary = models.CharField(max_length=7, default='#1E40AF')
    settings = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'companies'
        verbose_name = 'Şirket'
        unique_together = ['group', 'slug']

    def __str__(self):
        return f"{self.parent.name} > {self.name}" if self.parent else self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        if self.parent:
            self.company_type = 'subsidiary'
        super().save(*args, **kwargs)
