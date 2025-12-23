from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Group, Company
from .serializers import GroupSerializer, CompanySerializer, CompanyListSerializer
from apps.accounts.models import UserCompany

class GroupViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAuthenticated]

class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'tax_number']
    lookup_field = 'slug'

    def get_serializer_class(self):
        if self.action == 'list':
            return CompanyListSerializer
        return CompanySerializer

    def get_queryset(self):
        """
        Kullanıcının sadece üyesi olduğu şirketleri getirir.
        Superuser hepsini görebilir.
        """
        user = self.request.user
        if user.is_superuser:
            return Company.objects.all()
        
        # Kullanıcının üye olduğu şirketlerin ID'leri
        company_ids = user.company_memberships.values_list('company_id', flat=True)
        return Company.objects.filter(id__in=company_ids)

    @action(detail=False, methods=['get'])
    def mine(self, request):
        """Kullanıcının üye olduğu şirketleri hiyerarşik olarak getir"""
        queryset = self.get_queryset()
        serializer = CompanyListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def switch(self, request, slug=None):
        """
        Kullanıcının aktif şirketini değiştirir.
        Backend'de DB'de is_default flag'ini günceller.
        Superuser için otomatik üyelik oluşturulur.
        """
        company = self.get_object()
        user = request.user

        # Superuser için explicit membership kontrolü atla, ama yine de kayıt oluştur
        if user.is_superuser:
            membership, created = UserCompany.objects.get_or_create(
                user=user, 
                company=company,
                defaults={'is_owner': True}
            )
        else:
            # Normal kullanıcı için üyelik VAR MI kontrol et
            membership = get_object_or_404(UserCompany, user=user, company=company)

        # Diğer tüm üyeliklerin is_default flagini false yap
        UserCompany.objects.filter(user=user, is_default=True).update(is_default=False)
        
        # Seçilen şirketi default yap
        membership.is_default = True
        membership.save()

        return Response({'status': 'success', 'message': f'Active company switched to {company.name}'})
