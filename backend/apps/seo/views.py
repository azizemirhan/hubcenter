from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Sum, Avg
from .models import SEOPackage, SEOKeyword, SEOReport, SEOTask
from .serializers import (
    SEOPackageSerializer, SEOPackageListSerializer,
    SEOKeywordSerializer, SEOReportSerializer, SEOTaskSerializer
)


class SEOPackageViewSet(viewsets.ModelViewSet):
    queryset = SEOPackage.objects.all()
    serializer_class = SEOPackageSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['customer', 'status', 'package_type']
    search_fields = ['customer__company_name', 'domain__domain_name']
    ordering_fields = ['created_at', 'start_date', 'monthly_fee']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return SEOPackageListSerializer
        return SEOPackageSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return SEOPackage.objects.all()
        
        active_company = user.active_company
        if active_company:
            return SEOPackage.objects.filter(company=active_company)
        return SEOPackage.objects.none()

    def perform_create(self, serializer):
        serializer.save(
            company=self.request.user.active_company,
            created_by=self.request.user
        )

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get SEO statistics"""
        queryset = self.get_queryset()
        
        active_packages = queryset.filter(status='active')
        monthly_revenue = active_packages.aggregate(total=Sum('monthly_fee'))['total'] or 0
        
        summary = {
            'total': queryset.count(),
            'active': active_packages.count(),
            'paused': queryset.filter(status='paused').count(),
            'monthly_revenue': float(monthly_revenue),
        }
        return Response(summary)


class SEOKeywordViewSet(viewsets.ModelViewSet):
    queryset = SEOKeyword.objects.all()
    serializer_class = SEOKeywordSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['package']
    search_fields = ['keyword']

    def get_queryset(self):
        user = self.request.user
        package_id = self.request.query_params.get('package')
        
        qs = SEOKeyword.objects.all()
        if package_id:
            qs = qs.filter(package_id=package_id)
        
        if not user.is_superuser:
            active_company = user.active_company
            if active_company:
                qs = qs.filter(package__company=active_company)
            else:
                qs = qs.none()
        
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def update_position(self, request, pk=None):
        """Update keyword position"""
        keyword = self.get_object()
        new_position = request.data.get('position')
        
        if new_position is not None:
            keyword.previous_position = keyword.current_position
            keyword.current_position = int(new_position)
            keyword.last_checked = timezone.now()
            keyword.save()
            return Response({'status': 'success'})
        return Response({'error': 'Position required'}, status=status.HTTP_400_BAD_REQUEST)


class SEOReportViewSet(viewsets.ModelViewSet):
    queryset = SEOReport.objects.all()
    serializer_class = SEOReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['package']

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return SEOReport.objects.all()
        
        active_company = user.active_company
        if active_company:
            return SEOReport.objects.filter(package__company=active_company)
        return SEOReport.objects.none()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class SEOTaskViewSet(viewsets.ModelViewSet):
    queryset = SEOTask.objects.all()
    serializer_class = SEOTaskSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['package', 'status', 'task_type', 'assigned_to']
    search_fields = ['title', 'description']

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return SEOTask.objects.all()
        
        active_company = user.active_company
        if active_company:
            return SEOTask.objects.filter(package__company=active_company)
        return SEOTask.objects.none()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark task as completed"""
        task = self.get_object()
        task.status = 'completed'
        task.completed_at = timezone.now()
        task.save()
        return Response({'status': 'success'})
