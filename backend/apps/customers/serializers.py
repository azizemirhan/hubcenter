from rest_framework import serializers
from .models import Customer, CustomerContact, CustomerNote

class CustomerContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerContact
        fields = ['id', 'name', 'title', 'email', 'phone', 'is_primary', 'created_at']

class CustomerNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerNote
        fields = ['id', 'note_type', 'content', 'contact_date', 'created_by_id', 'created_at']
        read_only_fields = ['created_by_id']

class CustomerSerializer(serializers.ModelSerializer):
    contacts = CustomerContactSerializer(many=True, read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    source_display = serializers.CharField(source='get_source_display', read_only=True)
    industry_display = serializers.CharField(source='get_industry_display', read_only=True)
    
    class Meta:
        model = Customer
        fields = [
            # Basic Info
            'id', 'company_name', 'contact_person', 'title', 'email', 'secondary_email',
            'phone', 'secondary_phone',
            # Address
            'address', 'city', 'district', 'postal_code', 'country',
            # Tax & Legal
            'tax_number', 'tax_office', 'trade_registry_no', 'mersis_no',
            # Business Info
            'sector', 'industry', 'industry_display', 'website', 'employee_count', 'annual_revenue',
            # Social Media
            'facebook', 'instagram', 'linkedin', 'twitter',
            # CRM Fields
            'status', 'priority', 'priority_display', 'source', 'source_display', 
            'assigned_to', 'assigned_to_name',
            # Services
            'has_seo_service', 'has_hosting_service', 'has_social_media_service',
            'has_ads_service', 'has_web_design_service',
            # Contract
            'contract_start_date', 'contract_end_date', 'monthly_fee', 'payment_day',
            # Additional
            'notes', 'tags', 'logo', 'birth_date',
            # Meta
            'created_at', 'contacts'
        ]
        read_only_fields = ['created_at', 'assigned_to_name', 'priority_display', 'source_display', 'industry_display']


class CustomerListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views"""
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    
    class Meta:
        model = Customer
        fields = [
            'id', 'company_name', 'contact_person', 'email', 'phone', 'website',
            'status', 'priority', 'has_seo_service', 'has_hosting_service',
            'has_social_media_service', 'has_ads_service', 'assigned_to_name', 'created_at'
        ]

