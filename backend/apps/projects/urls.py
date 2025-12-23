from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet, BoardColumnViewSet

router = DefaultRouter()
router.register(r'list', ProjectViewSet)
router.register(r'columns', BoardColumnViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
