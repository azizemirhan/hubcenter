from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DomainViewSet, HostingViewSet

router = DefaultRouter()
router.register(r'list', DomainViewSet)
router.register(r'hosting', HostingViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
