from django.db import models
from django.conf import settings
from core.models import AuditableModel

class Task(AuditableModel):
    PRIORITY_CHOICES = [('low', 'Düşük'), ('medium', 'Orta'), ('high', 'Yüksek'), ('urgent', 'Acil')]
    STATUS_CHOICES = [('backlog', 'Backlog'), ('todo', 'Yapılacak'), ('in_progress', 'Devam Ediyor'), ('review', 'İncelemede'), ('completed', 'Tamamlandı')]
    PERIOD_CHOICES = [('once', 'Tek Seferlik'), ('daily', 'Günlük'), ('weekly', 'Haftalık'), ('monthly', 'Aylık')]

    project = models.ForeignKey('projects.Project', on_delete=models.CASCADE, related_name='tasks', null=True, blank=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='subtasks')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tasks')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='todo')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    period_type = models.CharField(max_length=10, choices=PERIOD_CHOICES, default='once')
    due_date = models.DateField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    estimated_hours = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    board_column = models.ForeignKey('projects.BoardColumn', on_delete=models.SET_NULL, null=True, blank=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'tasks'
        ordering = ['sort_order', '-created_at']

    @property
    def total_time_spent(self):
        return self.time_entries.aggregate(total=models.Sum('duration_minutes'))['total'] or 0


class TaskTag(AuditableModel):
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=7, default='#6B7280')

    class Meta:
        db_table = 'task_tags'


class TaskTagPivot(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='task_tags')
    tag = models.ForeignKey(TaskTag, on_delete=models.CASCADE)

    class Meta:
        db_table = 'task_tag_pivot'
        unique_together = ['task', 'tag']


class TimeEntry(AuditableModel):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='time_entries')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='time_entries')
    started_at = models.DateTimeField()
    ended_at = models.DateTimeField(null=True, blank=True)
    duration_minutes = models.PositiveIntegerField(default=0)
    description = models.TextField(blank=True)
    is_billable = models.BooleanField(default=True)

    class Meta:
        db_table = 'time_entries'
        ordering = ['-started_at']

    def save(self, *args, **kwargs):
        if self.ended_at and self.started_at:
            self.duration_minutes = int((self.ended_at - self.started_at).total_seconds() / 60)
        super().save(*args, **kwargs)
