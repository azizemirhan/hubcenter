from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from datetime import timedelta
from .models import Domain, Hosting
from .serializers import DomainSerializer, DomainListSerializer, HostingSerializer, HostingListSerializer


class DomainViewSet(viewsets.ModelViewSet):
    queryset = Domain.objects.all()
    serializer_class = DomainSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['customer', 'registrar', 'auto_renew']
    search_fields = ['domain_name', 'registrar', 'dns_provider']
    ordering_fields = ['expire_date', 'domain_name', 'created_at']
    ordering = ['expire_date']

    def get_serializer_class(self):
        if self.action == 'list':
            return DomainListSerializer
        return DomainSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Domain.objects.select_related('customer', 'created_by').all()
        
        active_company = user.active_company
        if active_company:
            return Domain.objects.select_related('customer', 'created_by').filter(company=active_company)
        return Domain.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        serializer.save(
            company=user.active_company,
            created_by=user
        )

    @action(detail=False, methods=['get'])
    def expiring_soon(self, request):
        """Get domains expiring within 30 days"""
        queryset = self.get_queryset()
        today = timezone.now().date()
        threshold = today + timedelta(days=30)
        expiring = queryset.filter(expire_date__lte=threshold, expire_date__gte=today)
        serializer = DomainListSerializer(expiring, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get domain statistics"""
        queryset = self.get_queryset()
        today = timezone.now().date()
        
        summary = {
            'total': queryset.count(),
            'expiring_7_days': queryset.filter(expire_date__lte=today + timedelta(days=7), expire_date__gte=today).count(),
            'expiring_30_days': queryset.filter(expire_date__lte=today + timedelta(days=30), expire_date__gte=today).count(),
            'auto_renew_enabled': queryset.filter(auto_renew=True).count(),
        }
        return Response(summary)


class HostingViewSet(viewsets.ModelViewSet):
    queryset = Hosting.objects.all()
    serializer_class = HostingSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['customer', 'provider']
    search_fields = ['provider', 'plan_name', 'server_ip']
    ordering_fields = ['expire_date', 'provider', 'created_at']
    ordering = ['expire_date']

    def get_serializer_class(self):
        if self.action == 'list':
            return HostingListSerializer
        return HostingSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Hosting.objects.select_related('customer', 'created_by').all()
        
        active_company = user.active_company
        if active_company:
            return Hosting.objects.select_related('customer', 'created_by').filter(company=active_company)
        return Hosting.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        serializer.save(
            company=user.active_company,
            created_by=user
        )

    @action(detail=False, methods=['get'])
    def expiring_soon(self, request):
        """Get hostings expiring within 30 days"""
        queryset = self.get_queryset()
        today = timezone.now().date()
        threshold = today + timedelta(days=30)
        expiring = queryset.filter(expire_date__lte=threshold, expire_date__gte=today)
        serializer = HostingListSerializer(expiring, many=True)
        return Response(expiring.data)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get hosting statistics"""
        queryset = self.get_queryset()
        today = timezone.now().date()
        
        # Calculate monthly revenue
        total_monthly = sum(h.monthly_cost or 0 for h in queryset)
        
        summary = {
            'total': queryset.count(),
            'expiring_30_days': queryset.filter(expire_date__lte=today + timedelta(days=30), expire_date__gte=today).count(),
            'total_monthly_cost': float(total_monthly),
        }
        return Response(summary)
