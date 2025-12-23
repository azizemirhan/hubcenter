from rest_framework import serializers
from .models import Lead, LeadActivity

class LeadActivitySerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = LeadActivity
        fields = ['id', 'lead', 'activity_type', 'description', 'contact_date', 
                  'next_action', 'next_action_date', 'created_by_name', 'created_at']
        read_only_fields = ['id', 'created_by_name', 'created_at']


class LeadSerializer(serializers.ModelSerializer):
    activities = LeadActivitySerializer(many=True, read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    source_display = serializers.CharField(source='get_source_display', read_only=True)

    class Meta:
        model = Lead
        fields = [
            'id', 'company_name', 'contact_person', 'email', 'phone',
            'source', 'source_display', 'status', 'status_display',
            'expected_value', 'next_contact_date', 'next_action',
            'assigned_to', 'assigned_to_name', 'notes', 'lost_reason',
            'converted_customer', 'converted_at',
            'activities', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'activities', 'created_by_name', 'created_at', 'updated_at', 
                           'status_display', 'source_display', 'assigned_to_name']


class LeadListSerializer(serializers.ModelSerializer):
    """Lighter serializer for list views and Kanban"""
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    source_display = serializers.CharField(source='get_source_display', read_only=True)

    class Meta:
        model = Lead
        fields = [
            'id', 'company_name', 'contact_person', 'phone', 'email',
            'source', 'source_display', 'status', 'status_display',
            'expected_value', 'next_contact_date',
            'assigned_to', 'assigned_to_name', 'created_at'
        ]
