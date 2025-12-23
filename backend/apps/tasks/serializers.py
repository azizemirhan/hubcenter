from rest_framework import serializers
from .models import Task, TaskTag, TimeEntry


class TaskTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskTag
        fields = ['id', 'name', 'color']


class TimeEntrySerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)

    class Meta:
        model = TimeEntry
        fields = ['id', 'task', 'user', 'user_name', 'started_at', 'ended_at', 
                  'duration_minutes', 'description', 'is_billable', 'created_at']
        read_only_fields = ['id', 'user_name', 'duration_minutes', 'created_at']


class TaskSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    total_time_spent = serializers.IntegerField(read_only=True)
    subtask_count = serializers.IntegerField(read_only=True, default=0)  # Annotated in view

    class Meta:
        model = Task
        fields = [
            'id', 'project', 'project_name', 'parent', 'title', 'description',
            'assigned_to', 'assigned_to_name', 'status', 'status_display',
            'priority', 'priority_display', 'period_type', 'due_date',
            'completed_at', 'estimated_hours', 'board_column', 'sort_order',
            'total_time_spent', 'subtask_count',
            'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'project_name', 'assigned_to_name', 'created_by_name',
                           'status_display', 'priority_display', 'total_time_spent',
                           'subtask_count', 'created_at', 'updated_at']


class TaskListSerializer(serializers.ModelSerializer):
    """Lighter serializer for list views and Kanban"""
    project_name = serializers.CharField(source='project.name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)

    class Meta:
        model = Task
        fields = [
            'id', 'project', 'project_name', 'title',
            'assigned_to', 'assigned_to_name', 'status', 'status_display',
            'priority', 'priority_display', 'due_date', 'sort_order', 'created_at'
        ]
