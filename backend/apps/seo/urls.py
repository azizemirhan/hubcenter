from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SEOPackageViewSet, SEOKeywordViewSet, SEOReportViewSet, SEOTaskViewSet

router = DefaultRouter()
router.register(r'packages', SEOPackageViewSet)
router.register(r'keywords', SEOKeywordViewSet)
router.register(r'reports', SEOReportViewSet)
router.register(r'tasks', SEOTaskViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
