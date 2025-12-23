from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Lead, LeadActivity
from .serializers import LeadSerializer, LeadListSerializer, LeadActivitySerializer


class LeadViewSet(viewsets.ModelViewSet):
    queryset = Lead.objects.all()
    serializer_class = LeadSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'source', 'assigned_to']
    search_fields = ['company_name', 'contact_person', 'email', 'phone']
    ordering_fields = ['created_at', 'expected_value', 'next_contact_date']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return LeadListSerializer
        return LeadSerializer

    def get_queryset(self):
        user = self.request.user
        # Lead model doesn't have company field, return all leads for authenticated users
        return Lead.objects.select_related('assigned_to', 'created_by').all()

    def perform_create(self, serializer):
        user = self.request.user
        serializer.save(created_by=user)

    @action(detail=False, methods=['get'])
    def kanban(self, request):
        """Get leads grouped by status for Kanban view"""
        queryset = self.get_queryset()
        serializer = LeadListSerializer(queryset, many=True)
        
        # Group by status
        grouped = {}
        for lead in serializer.data:
            status_key = lead['status']
            if status_key not in grouped:
                grouped[status_key] = []
            grouped[status_key].append(lead)
        
        return Response(grouped)

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update lead status (for Kanban drag-drop)"""
        lead = self.get_object()
        new_status = request.data.get('status')
        
        valid_statuses = [s[0] for s in Lead.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        
        lead.status = new_status
        lead.save()
        
        return Response({'status': 'success', 'new_status': new_status})


class LeadActivityViewSet(viewsets.ModelViewSet):
    queryset = LeadActivity.objects.all()
    serializer_class = LeadActivitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        lead_id = self.request.query_params.get('lead')
        
        qs = LeadActivity.objects.select_related('lead', 'created_by').all()
        if lead_id:
            qs = qs.filter(lead_id=lead_id)
        
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
