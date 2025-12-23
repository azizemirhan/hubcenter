from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LeadViewSet, LeadActivityViewSet

router = DefaultRouter()
router.register(r'list', LeadViewSet)
router.register(r'activities', LeadActivityViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
