from rest_framework import serializers
from .models import Domain, Hosting


class DomainSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.company_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    days_until_expiry = serializers.IntegerField(read_only=True)

    class Meta:
        model = Domain
        fields = [
            'id', 'customer', 'customer_name', 'domain_name', 'registrar',
            'register_date', 'expire_date', 'auto_renew', 'dns_provider',
            'nameservers', 'ssl_provider', 'ssl_expire_date', 'notes',
            'notify_30_days', 'notify_15_days', 'notify_7_days',
            'days_until_expiry', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'customer_name', 'days_until_expiry', 'created_by_name', 
                           'created_at', 'updated_at']


class DomainListSerializer(serializers.ModelSerializer):
    """Lighter serializer for list views"""
    customer_name = serializers.CharField(source='customer.company_name', read_only=True)
    days_until_expiry = serializers.IntegerField(read_only=True)

    class Meta:
        model = Domain
        fields = [
            'id', 'customer', 'customer_name', 'domain_name', 'registrar',
            'expire_date', 'auto_renew', 'ssl_expire_date', 'days_until_expiry'
        ]


class HostingSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.company_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = Hosting
        fields = [
            'id', 'customer', 'customer_name', 'provider', 'plan_name',
            'server_ip', 'server_location', 'disk_space', 'bandwidth',
            'start_date', 'expire_date', 'monthly_cost', 'currency',
            'cpanel_url', 'notes', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'customer_name', 'created_by_name', 'created_at', 'updated_at']


class HostingListSerializer(serializers.ModelSerializer):
    """Lighter serializer for list views"""
    customer_name = serializers.CharField(source='customer.company_name', read_only=True)

    class Meta:
        model = Hosting
        fields = [
            'id', 'customer', 'customer_name', 'provider', 'plan_name',
            'server_ip', 'expire_date', 'monthly_cost', 'currency'
        ]
