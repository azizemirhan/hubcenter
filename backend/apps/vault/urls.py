from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CredentialViewSet, MailAccountViewSet

router = DefaultRouter()
router.register('credentials', CredentialViewSet, basename='credential')
router.register('mail-accounts', MailAccountViewSet, basename='mail-account')

urlpatterns = [
    path('', include(router.urls)),
]
