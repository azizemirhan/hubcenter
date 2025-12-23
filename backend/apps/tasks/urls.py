from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TaskViewSet, TaskTagViewSet, TimeEntryViewSet

router = DefaultRouter()
router.register(r'list', TaskViewSet)
router.register(r'tags', TaskTagViewSet)
router.register(r'time-entries', TimeEntryViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
