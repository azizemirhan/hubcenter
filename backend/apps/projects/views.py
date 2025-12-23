from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Project, BoardColumn
from .serializers import ProjectSerializer, ProjectListSerializer, BoardColumnSerializer


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'customer', 'manager', 'is_billable']
    search_fields = ['name', 'description', 'customer__company_name']
    ordering_fields = ['created_at', 'deadline', 'start_date', 'budget']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return ProjectListSerializer
        return ProjectSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Project.objects.select_related('customer', 'manager', 'created_by').all()
        
        active_company = user.active_company
        if active_company:
            return Project.objects.select_related('customer', 'manager', 'created_by').filter(company=active_company)
        return Project.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        serializer.save(
            company=user.active_company,
            created_by=user
        )

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get project statistics summary"""
        queryset = self.get_queryset()
        
        summary = {
            'total': queryset.count(),
            'planning': queryset.filter(status='planning').count(),
            'in_progress': queryset.filter(status='in_progress').count(),
            'on_hold': queryset.filter(status='on_hold').count(),
            'completed': queryset.filter(status='completed').count(),
            'cancelled': queryset.filter(status='cancelled').count(),
        }
        
        return Response(summary)

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update project status"""
        project = self.get_object()
        new_status = request.data.get('status')
        
        valid_statuses = [s[0] for s in Project.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        
        project.status = new_status
        project.save()
        
        return Response({'status': 'success', 'new_status': new_status})


class BoardColumnViewSet(viewsets.ModelViewSet):
    queryset = BoardColumn.objects.all()
    serializer_class = BoardColumnSerializer
    permission_classes = [permissions.IsAuthenticated]
    ordering = ['sort_order']

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return BoardColumn.objects.all()
        
        active_company = user.active_company
        if active_company:
            return BoardColumn.objects.filter(company=active_company)
        return BoardColumn.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        serializer.save(
            company=user.active_company,
            created_by=user
        )
