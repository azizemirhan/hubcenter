from rest_framework import serializers
from .models import Group, Company

class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ['id', 'name', 'slug', 'logo', 'settings', 'created_at']

class CompanySerializer(serializers.ModelSerializer):
    group = GroupSerializer(read_only=True)
    
    class Meta:
        model = Company
        fields = [
            'id', 'group', 'parent', 'company_type', 'name', 'slug', 
            'tax_number', 'tax_office', 'address', 'phone', 'email', 
            'website', 'logo', 'color_primary', 'color_secondary', 
            'settings', 'is_active', 'created_at'
        ]

class CompanyListSerializer(serializers.ModelSerializer):
    """Lighter serializer for list views"""
    class Meta:
        model = Company
        fields = ['id', 'name', 'slug', 'logo', 'company_type', 'is_active']
