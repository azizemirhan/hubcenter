from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FolderViewSet, FileViewSet, FileShareViewSet
from .oauth_views import (
    GoogleDriveConnectView, GoogleDriveCallbackView,
    GoogleDriveDisconnectView, GoogleDriveStatusView
)

router = DefaultRouter()
router.register(r'folders', FolderViewSet)
router.register(r'list', FileViewSet)
router.register(r'shares', FileShareViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('oauth/connect/', GoogleDriveConnectView.as_view(), name='drive-connect'),
    path('oauth/callback/', GoogleDriveCallbackView.as_view(), name='drive-callback'),
    path('oauth/disconnect/', GoogleDriveDisconnectView.as_view(), name='drive-disconnect'),
    path('oauth/status/', GoogleDriveStatusView.as_view(), name='drive-status'),
]
