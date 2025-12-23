from rest_framework import serializers
from .models import SEOPackage, SEOKeyword, SEOReport, SEOTask


class SEOKeywordSerializer(serializers.ModelSerializer):
    position_change = serializers.SerializerMethodField()

    class Meta:
        model = SEOKeyword
        fields = [
            'id', 'package', 'keyword', 'search_volume', 'difficulty',
            'target_position', 'current_position', 'previous_position',
            'position_change', 'last_checked'
        ]
        read_only_fields = ['id', 'position_change']

    def get_position_change(self, obj):
        if obj.current_position and obj.previous_position:
            return obj.previous_position - obj.current_position
        return None


class SEOReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = SEOReport
        fields = [
            'id', 'package', 'report_date', 'organic_traffic', 'backlinks_count',
            'indexed_pages', 'average_position', 'top_10_keywords', 'top_30_keywords',
            'summary', 'report_file', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class SEOTaskSerializer(serializers.ModelSerializer):
    task_type_display = serializers.CharField(source='get_task_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)

    class Meta:
        model = SEOTask
        fields = [
            'id', 'package', 'task_type', 'task_type_display', 'title', 'description',
            'status', 'status_display', 'assigned_to', 'assigned_to_name',
            'due_date', 'completed_at', 'created_at'
        ]
        read_only_fields = ['id', 'task_type_display', 'status_display', 'assigned_to_name', 'created_at']


class SEOPackageSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.company_name', read_only=True)
    domain_name = serializers.CharField(source='domain.domain_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    package_type_display = serializers.CharField(source='get_package_type_display', read_only=True)
    keywords = SEOKeywordSerializer(many=True, read_only=True)
    keyword_count = serializers.SerializerMethodField()

    class Meta:
        model = SEOPackage
        fields = [
            'id', 'customer', 'customer_name', 'domain', 'domain_name',
            'package_type', 'package_type_display', 'status', 'status_display',
            'start_date', 'end_date', 'monthly_fee', 'currency',
            'target_keywords', 'notes', 'keywords', 'keyword_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'customer_name', 'domain_name', 'status_display',
                           'package_type_display', 'keywords', 'keyword_count', 'created_at', 'updated_at']

    def get_keyword_count(self, obj):
        return obj.keywords.count()


class SEOPackageListSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.company_name', read_only=True)
    domain_name = serializers.CharField(source='domain.domain_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    package_type_display = serializers.CharField(source='get_package_type_display', read_only=True)
    keyword_count = serializers.SerializerMethodField()

    class Meta:
        model = SEOPackage
        fields = [
            'id', 'customer', 'customer_name', 'domain_name',
            'package_type', 'package_type_display', 'status', 'status_display',
            'start_date', 'monthly_fee', 'currency', 'keyword_count'
        ]

    def get_keyword_count(self, obj):
        return obj.keywords.count()
