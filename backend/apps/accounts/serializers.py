from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import UserCompany, Role

User = get_user_model()

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name', 'is_system']

class UserCompanySerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    company_slug = serializers.CharField(source='company.slug', read_only=True)
    company_logo = serializers.ImageField(source='company.logo', read_only=True)
    role = RoleSerializer(read_only=True)

    class Meta:
        model = UserCompany
        fields = ['id', 'company', 'company_name', 'company_slug', 'company_logo', 'role', 'is_owner', 'is_default']

class UserSerializer(serializers.ModelSerializer):
    companies = UserCompanySerializer(source='company_memberships', many=True, read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'phone', 'avatar', 'companies', 'date_joined']

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Add extra data to token response
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
        }
        return data
