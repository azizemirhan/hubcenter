from rest_framework import serializers
from .models import Project, BoardColumn
from apps.customers.serializers import CustomerSerializer


class BoardColumnSerializer(serializers.ModelSerializer):
    class Meta:
        model = BoardColumn
        fields = ['id', 'name', 'color', 'sort_order', 'is_default']


class ProjectSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.company_name', read_only=True)
    manager_name = serializers.CharField(source='manager.get_full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Project
        fields = [
            'id', 'customer', 'customer_name', 'name', 'description',
            'status', 'status_display', 'start_date', 'end_date', 'deadline',
            'budget', 'hourly_rate', 'currency', 'is_billable',
            'manager', 'manager_name', 'created_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'customer_name', 'manager_name', 'created_by_name', 
                           'status_display', 'created_at', 'updated_at']


class ProjectListSerializer(serializers.ModelSerializer):
    """Lighter serializer for list views"""
    customer_name = serializers.CharField(source='customer.company_name', read_only=True)
    manager_name = serializers.CharField(source='manager.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Project
        fields = [
            'id', 'customer', 'customer_name', 'name', 
            'status', 'status_display', 'start_date', 'deadline',
            'budget', 'currency', 'is_billable',
            'manager', 'manager_name', 'created_at'
        ]
