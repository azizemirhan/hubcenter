from rest_framework import serializers
from .models import Credential, MailAccount
from .encryption import encrypt_password, decrypt_password


class CredentialListSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    credential_type_display = serializers.CharField(source='get_credential_type_display', read_only=True)
    
    class Meta:
        model = Credential
        fields = [
            'id', 'customer', 'customer_name', 'credential_type', 'credential_type_display',
            'title', 'url', 'username', 'notes', 'view_count', 'last_viewed_at',
            'created_at', 'updated_at'
        ]


class CredentialSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    credential_type_display = serializers.CharField(source='get_credential_type_display', read_only=True)
    password = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = Credential
        fields = [
            'id', 'customer', 'customer_name', 'credential_type', 'credential_type_display',
            'title', 'url', 'username', 'password', 'notes', 'view_count', 
            'last_viewed_at', 'last_viewed_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['view_count', 'last_viewed_at', 'last_viewed_by']
    
    def create(self, validated_data):
        password = validated_data.pop('password', None)
        if password:
            validated_data['password_encrypted'] = encrypt_password(password)
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        if password:
            validated_data['password_encrypted'] = encrypt_password(password)
        return super().update(instance, validated_data)


class CredentialPasswordSerializer(serializers.Serializer):
    """Serializer for revealing password"""
    password = serializers.SerializerMethodField()
    
    def get_password(self, obj):
        try:
            return decrypt_password(obj.password_encrypted)
        except Exception:
            return None


class MailAccountListSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    
    class Meta:
        model = MailAccount
        fields = [
            'id', 'customer', 'customer_name', 'email', 
            'smtp_server', 'smtp_port', 'smtp_security',
            'imap_server', 'imap_port', 'notes',
            'created_at', 'updated_at'
        ]


class MailAccountSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    password = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = MailAccount
        fields = [
            'id', 'customer', 'customer_name', 'email', 'password',
            'smtp_server', 'smtp_port', 'smtp_security',
            'imap_server', 'imap_port', 'notes',
            'created_at', 'updated_at'
        ]
    
    def create(self, validated_data):
        password = validated_data.pop('password', None)
        if password:
            validated_data['password_encrypted'] = encrypt_password(password)
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        if password:
            validated_data['password_encrypted'] = encrypt_password(password)
        return super().update(instance, validated_data)


class MailAccountPasswordSerializer(serializers.Serializer):
    """Serializer for revealing mail password"""
    password = serializers.SerializerMethodField()
    
    def get_password(self, obj):
        try:
            return decrypt_password(obj.password_encrypted)
        except Exception:
            return None
