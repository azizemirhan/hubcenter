from django.db import models
from django.conf import settings
from core.models import AuditableModel

class Folder(AuditableModel):
    FOLDER_TYPES = [('general', 'Genel'), ('customer', 'Müşteri'), ('project', 'Proje'), ('template', 'Şablon')]
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='subfolders')
    name = models.CharField(max_length=255)
    folder_type = models.CharField(max_length=20, choices=FOLDER_TYPES, default='general')
    customer = models.ForeignKey('customers.Customer', on_delete=models.CASCADE, null=True, blank=True, related_name='folders')
    project = models.ForeignKey('projects.Project', on_delete=models.CASCADE, null=True, blank=True, related_name='folders')
    
    # Google Drive sync
    drive_folder_id = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = 'folders'

    @property
    def full_path(self):
        return f"{self.parent.full_path}/{self.name}" if self.parent else self.name



class File(AuditableModel):
    folder = models.ForeignKey(Folder, on_delete=models.CASCADE, related_name='files', null=True, blank=True)
    name = models.CharField(max_length=255)
    original_name = models.CharField(max_length=255)
    file = models.FileField(upload_to='files/%Y/%m/', blank=True, null=True)
    size = models.PositiveIntegerField(default=0)
    mime_type = models.CharField(max_length=100)
    customer = models.ForeignKey('customers.Customer', on_delete=models.CASCADE, null=True, blank=True, related_name='files')
    project = models.ForeignKey('projects.Project', on_delete=models.CASCADE, null=True, blank=True, related_name='files')
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    is_public = models.BooleanField(default=False)
    download_count = models.PositiveIntegerField(default=0)
    
    # Google Drive fields
    drive_file_id = models.CharField(max_length=255, blank=True, null=True)
    drive_view_link = models.URLField(max_length=500, blank=True, null=True)
    drive_download_link = models.URLField(max_length=500, blank=True, null=True)
    is_synced_to_drive = models.BooleanField(default=False)

    class Meta:
        db_table = 'files'
        ordering = ['-created_at']


class FileShare(AuditableModel):
    PERMISSION_CHOICES = [('view', 'Görüntüleme'), ('download', 'İndirme'), ('edit', 'Düzenleme')]
    file = models.ForeignKey(File, on_delete=models.CASCADE, related_name='shares')
    shared_with = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    permission = models.CharField(max_length=10, choices=PERMISSION_CHOICES, default='view')
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'file_shares'
        unique_together = ['file', 'shared_with']
