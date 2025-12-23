from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CustomerViewSet, CustomerContactViewSet, CustomerNoteViewSet

router = DefaultRouter()
router.register(r'list', CustomerViewSet, basename='customer')
router.register(r'contacts', CustomerContactViewSet, basename='customer-contacts')
router.register(r'notes', CustomerNoteViewSet, basename='customer-notes')

urlpatterns = [
    path('', include(router.urls)),
]
