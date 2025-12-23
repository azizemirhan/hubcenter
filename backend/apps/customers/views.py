from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Customer, CustomerContact, CustomerNote
from .serializers import CustomerSerializer, CustomerListSerializer, CustomerContactSerializer, CustomerNoteSerializer

class CustomerViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CustomerSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['company_name', 'contact_person', 'email', 'phone', 'tax_number']
    ordering_fields = ['company_name', 'created_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return CustomerListSerializer
        return CustomerSerializer

    def get_queryset(self):
        # Filter by current user's active company
        user = self.request.user
        if not user.active_company:
            return Customer.objects.none()
        return Customer.objects.select_related(
            'assigned_to', 'created_by'
        ).prefetch_related('contacts').filter(company=user.active_company)

    def perform_create(self, serializer):
        user = self.request.user
        if not user.active_company:
             raise serializers.ValidationError({"company": "Active company not found for user."})
        serializer.save(created_by=user, company=user.active_company)

class CustomerContactViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CustomerContactSerializer
    queryset = CustomerContact.objects.all()

    def get_queryset(self):
        user = self.request.user
        if not user.active_company:
            return CustomerContact.objects.none()
        
        qs = CustomerContact.objects.select_related('customer', 'created_by').filter(company=user.active_company)
        
        customer_id = self.request.query_params.get('customer')
        if customer_id:
            qs = qs.filter(customer_id=customer_id)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        if not user.active_company:
             raise serializers.ValidationError({"company": "Active company not found for user."})
        serializer.save(created_by=user, company=user.active_company)

class CustomerNoteViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CustomerNoteSerializer
    queryset = CustomerNote.objects.all()
    
    def get_queryset(self):
        user = self.request.user
        if not user.active_company:
            return CustomerNote.objects.none()
            
        qs = CustomerNote.objects.select_related('customer', 'created_by').filter(company=user.active_company)

        customer_id = self.request.query_params.get('customer')
        if customer_id:
            qs = qs.filter(customer_id=customer_id)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        if not user.active_company:
             raise serializers.ValidationError({"company": "Active company not found for user."})
        serializer.save(created_by=user, company=user.active_company)
