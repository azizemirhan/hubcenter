from rest_framework import views, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
from .services.google_drive_oauth import drive_oauth_service


class GoogleDriveConnectView(views.APIView):
    """Initiate Google Drive OAuth connection"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        if not drive_oauth_service.is_configured:
            return Response(
                {'error': 'Google Drive OAuth not configured'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate redirect URI
        redirect_uri = request.build_absolute_uri('/api/v1/files/oauth/callback/')
        
        # Get authorization URL
        auth_url, state = drive_oauth_service.get_authorization_url(
            redirect_uri=redirect_uri,
            state=str(request.user.id)
        )
        
        return Response({
            'authorization_url': auth_url,
            'state': state
        })


class GoogleDriveCallbackView(views.APIView):
    """Handle Google Drive OAuth callback"""
    permission_classes = []  # No auth required for callback
    
    def get(self, request):
        code = request.query_params.get('code')
        state = request.query_params.get('state')
        error = request.query_params.get('error')
        
        if error:
            return Response({'error': error}, status=status.HTTP_400_BAD_REQUEST)
        
        if not code:
            return Response({'error': 'No code provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get redirect URI
        redirect_uri = request.build_absolute_uri('/api/v1/files/oauth/callback/')
        
        # Exchange code for tokens
        token_data = drive_oauth_service.exchange_code(code, redirect_uri)
        
        if not token_data:
            return Response({'error': 'Failed to exchange code'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Save token to user
        from apps.accounts.models import User
        try:
            user_id = int(state)
            user = User.objects.get(id=user_id)
            user.google_drive_token = token_data
            user.google_drive_connected = True
            user.save()
            
            # Redirect to frontend
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3001')
            from django.shortcuts import redirect
            return redirect(f'{frontend_url}/dashboard/files?connected=true')
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GoogleDriveDisconnectView(views.APIView):
    """Disconnect Google Drive"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        request.user.google_drive_token = None
        request.user.google_drive_connected = False
        request.user.save()
        return Response({'status': 'disconnected'})


class GoogleDriveStatusView(views.APIView):
    """Check Google Drive connection status"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        return Response({
            'is_configured': drive_oauth_service.is_configured,
            'is_connected': request.user.google_drive_connected,
            'folder_id': drive_oauth_service.get_shared_folder_id()
        })
