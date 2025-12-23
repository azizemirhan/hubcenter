from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Count
from .models import Task, TaskTag, TimeEntry
from .serializers import TaskSerializer, TaskListSerializer, TaskTagSerializer, TimeEntrySerializer


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'priority', 'project', 'assigned_to', 'period_type']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'due_date', 'priority', 'sort_order']
    ordering = ['sort_order', '-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return TaskListSerializer
        return TaskSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Task.objects.select_related(
            'project', 'assigned_to', 'created_by'
        ).annotate(
            subtask_count=Count('subtasks')
        ).filter(parent__isnull=True)  # Only top-level tasks
        
        if user.is_superuser:
            return qs
        
        active_company = user.active_company
        if active_company:
            return qs.filter(company=active_company)
        return qs.none()

    def perform_create(self, serializer):
        user = self.request.user
        serializer.save(
            company=user.active_company,
            created_by=user
        )

    @action(detail=False, methods=['get'])
    def kanban(self, request):
        """Get tasks grouped by status for Kanban view"""
        project_id = request.query_params.get('project')
        queryset = self.get_queryset()
        
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        
        serializer = TaskListSerializer(queryset, many=True)
        
        # Group by status
        grouped = {}
        for task in serializer.data:
            status_key = task['status']
            if status_key not in grouped:
                grouped[status_key] = []
            grouped[status_key].append(task)
        
        return Response(grouped)

    @action(detail=False, methods=['get'])
    def my_tasks(self, request):
        """Get tasks assigned to current user"""
        queryset = self.get_queryset().filter(assigned_to=request.user)
        serializer = TaskListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update task status"""
        task = self.get_object()
        new_status = request.data.get('status')
        
        valid_statuses = [s[0] for s in Task.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        
        task.status = new_status
        if new_status == 'completed':
            task.completed_at = timezone.now()
        task.save()
        
        return Response({'status': 'success', 'new_status': new_status})

    @action(detail=True, methods=['get'])
    def subtasks(self, request, pk=None):
        """Get subtasks of a task"""
        task = self.get_object()
        subtasks = task.subtasks.all()
        serializer = TaskListSerializer(subtasks, many=True)
        return Response(serializer.data)


class TaskTagViewSet(viewsets.ModelViewSet):
    queryset = TaskTag.objects.all()
    serializer_class = TaskTagSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return TaskTag.objects.all()
        
        active_company = user.active_company
        if active_company:
            return TaskTag.objects.filter(company=active_company)
        return TaskTag.objects.none()

    def perform_create(self, serializer):
        serializer.save(
            company=self.request.user.active_company,
            created_by=self.request.user
        )


class TimeEntryViewSet(viewsets.ModelViewSet):
    queryset = TimeEntry.objects.all()
    serializer_class = TimeEntrySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['task', 'user', 'is_billable']

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return TimeEntry.objects.select_related('user', 'task').all()
        
        active_company = user.active_company
        if active_company:
            return TimeEntry.objects.select_related('user', 'task').filter(task__company=active_company)
        return TimeEntry.objects.none()

    def perform_create(self, serializer):
        serializer.save(
            user=self.request.user,
            created_by=self.request.user
        )
