from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from django.utils import timezone

from .models import Credential, MailAccount
from .serializers import (
    CredentialSerializer, CredentialListSerializer, CredentialPasswordSerializer,
    MailAccountSerializer, MailAccountListSerializer, MailAccountPasswordSerializer
)


class CredentialViewSet(viewsets.ModelViewSet):
    queryset = Credential.objects.all()
    serializer_class = CredentialSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['customer', 'credential_type']
    search_fields = ['title', 'username', 'url', 'notes']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return CredentialListSerializer
        if self.action == 'reveal_password':
            return CredentialPasswordSerializer
        return CredentialSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Credential.objects.select_related('customer').all()
        active_company = user.active_company
        if active_company:
            return Credential.objects.select_related('customer').filter(company=active_company)
        return Credential.objects.none()

    def perform_create(self, serializer):
        serializer.save(
            company=self.request.user.active_company,
            created_by=self.request.user
        )

    @action(detail=True, methods=['get'])
    def reveal_password(self, request, pk=None):
        """Reveal the decrypted password - logs the access"""
        credential = self.get_object()
        
        # Update view tracking
        credential.view_count += 1
        credential.last_viewed_at = timezone.now()
        credential.last_viewed_by = request.user
        credential.save()
        
        serializer = CredentialPasswordSerializer(credential)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def types(self, request):
        """Get available credential types"""
        return Response([
            {'value': choice[0], 'label': choice[1]} 
            for choice in Credential.CREDENTIAL_TYPES
        ])


class MailAccountViewSet(viewsets.ModelViewSet):
    queryset = MailAccount.objects.all()
    serializer_class = MailAccountSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['customer']
    search_fields = ['email', 'smtp_server', 'notes']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return MailAccountListSerializer
        if self.action == 'reveal_password':
            return MailAccountPasswordSerializer
        return MailAccountSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return MailAccount.objects.select_related('customer').all()
        active_company = user.active_company
        if active_company:
            return MailAccount.objects.select_related('customer').filter(company=active_company)
        return MailAccount.objects.none()

    def perform_create(self, serializer):
        serializer.save(
            company=self.request.user.active_company,
            created_by=self.request.user
        )

    @action(detail=True, methods=['get'])
    def reveal_password(self, request, pk=None):
        """Reveal the mail account password"""
        mail_account = self.get_object()
        serializer = MailAccountPasswordSerializer(mail_account)
        return Response(serializer.data)
