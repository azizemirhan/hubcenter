from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from django_filters.rest_framework import DjangoFilterBackend
from django.http import HttpResponse
from .models import Folder, File, FileShare
from .serializers import (
    FolderSerializer, FileSerializer, FileListSerializer,
    FileShareSerializer, DriveFileSerializer
)
from .services.google_drive_oauth import drive_oauth_service



class FolderViewSet(viewsets.ModelViewSet):
    queryset = Folder.objects.all()
    serializer_class = FolderSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['parent', 'folder_type', 'customer', 'project']

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Folder.objects.all()
        active_company = user.active_company
        if active_company:
            return Folder.objects.filter(company=active_company)
        return Folder.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        folder = serializer.save(company=user.active_company, created_by=user)
        
        # Sync to Drive if user is connected
        if user.google_drive_connected and user.google_drive_token:
            parent_id = None
            if folder.parent and folder.parent.drive_folder_id:
                parent_id = folder.parent.drive_folder_id
            
            result = drive_oauth_service.create_folder(
                user.google_drive_token,
                folder.name,
                parent_id
            )
            if result:
                folder.drive_folder_id = result.get('id')
                folder.save()

    def perform_destroy(self, instance):
        user = self.request.user
        
        # Delete from Drive if synced
        if instance.drive_folder_id and user.google_drive_connected and user.google_drive_token:
            try:
                drive_oauth_service.delete_file(user.google_drive_token, instance.drive_folder_id)
            except Exception as e:
                print(f"Error deleting folder from Drive: {e}")
        
        instance.delete()

    @action(detail=False, methods=['get'])
    def tree(self, request):
        """Get folder tree structure with files"""
        def build_tree(parent_id=None):
            folders = self.get_queryset().filter(parent_id=parent_id)
            result = []
            for folder in folders:
                files = File.objects.filter(
                    folder=folder,
                    company=request.user.active_company
                ).values('id', 'name', 'original_name', 'mime_type', 'size')
                
                result.append({
                    'id': folder.id,
                    'name': folder.name,
                    'type': 'folder',
                    'children': build_tree(folder.id),
                    'files': list(files)
                })
            return result
        
        # Root folders
        tree = build_tree()
        
        # Root files (no folder)
        root_files = File.objects.filter(
            folder__isnull=True,
            company=request.user.active_company
        ).values('id', 'name', 'original_name', 'mime_type', 'size')
        
        return Response({
            'folders': tree,
            'root_files': list(root_files)
        })


class FileViewSet(viewsets.ModelViewSet):
    queryset = File.objects.all()
    serializer_class = FileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['customer', 'project', 'is_synced_to_drive']  # folder removed - handled manually
    search_fields = ['name', 'original_name']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return FileListSerializer
        return FileSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = File.objects.none()
        
        if user.is_superuser:
            queryset = File.objects.all()
        else:
            active_company = user.active_company
            if active_company:
                queryset = File.objects.filter(company=active_company)
        
        # Handle folder filter manually
        folder_param = self.request.query_params.get('folder', None)
        if folder_param == 'root' or folder_param == '':
            queryset = queryset.filter(folder__isnull=True)
        elif folder_param and folder_param.isdigit():
            queryset = queryset.filter(folder_id=int(folder_param))
        
        return queryset


    def perform_create(self, serializer):
        uploaded_file = self.request.FILES.get('file')
        
        # Dosya içeriğini önce oku (sonra okuyamazsın)
        file_content = None
        if uploaded_file:
            file_content = uploaded_file.read()
            uploaded_file.seek(0)  # File pointer'ı başa al
        
        file_instance = serializer.save(
            company=self.request.user.active_company,
            created_by=self.request.user,
            uploaded_by=self.request.user,
            original_name=uploaded_file.name if uploaded_file else '',
            size=uploaded_file.size if uploaded_file else 0,
            mime_type=uploaded_file.content_type if uploaded_file else ''
        )
        
        # Auto-sync to Google Drive if user connected
        user = self.request.user
        if user.google_drive_connected and user.google_drive_token and file_content:
            self._sync_to_drive(file_instance, file_content, user)


    def _sync_to_drive(self, file_instance, file_content, user):
        """Sync file to Google Drive using user's OAuth token"""
        if not user.google_drive_token:
            return
        
        result = drive_oauth_service.upload_file(
            token_data=user.google_drive_token,
            file_content=file_content,
            filename=file_instance.original_name,
            mime_type=file_instance.mime_type
        )
        
        if result:
            file_instance.drive_file_id = result.get('id')
            file_instance.drive_view_link = result.get('webViewLink')
            file_instance.drive_download_link = result.get('webContentLink')
            file_instance.is_synced_to_drive = True
            file_instance.save()

    @action(detail=True, methods=['post'])
    def sync_to_drive(self, request, pk=None):
        """Manually sync a file to Google Drive"""
        file_obj = self.get_object()
        user = request.user
        
        if not user.google_drive_connected:
            return Response({'error': 'Google Drive not connected'}, status=status.HTTP_400_BAD_REQUEST)
        
        if file_obj.is_synced_to_drive:
            return Response({'message': 'File already synced'})
        
        if file_obj.file:
            file_content = file_obj.file.read()
            self._sync_to_drive(file_obj, file_content, user)
            return Response({'status': 'success', 'drive_file_id': file_obj.drive_file_id})
        
        return Response({'error': 'No file content to sync'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def move_to_folder(self, request, pk=None):
        """Move file to another folder"""
        file_obj = self.get_object()
        folder_id = request.data.get('folder_id')
        
        if folder_id:
            try:
                folder = Folder.objects.get(id=folder_id)
                file_obj.folder = folder
            except Folder.DoesNotExist:
                return Response({'error': 'Folder not found'}, status=status.HTTP_404_NOT_FOUND)
        else:
            file_obj.folder = None  # Move to root
        
        file_obj.save()
        return Response({'status': 'success'})


    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download file (from Drive if synced)"""
        file_obj = self.get_object()
        file_obj.download_count += 1
        file_obj.save()
        
        if file_obj.is_synced_to_drive and file_obj.drive_file_id:
            user = request.user
            if user.google_drive_connected and user.google_drive_token:
                content = drive_oauth_service.download_file(user.google_drive_token, file_obj.drive_file_id)
                if content:
                    response = HttpResponse(content, content_type=file_obj.mime_type)
                    response['Content-Disposition'] = f'attachment; filename="{file_obj.original_name}"'
                    return response
        
        # Fallback to local file
        if file_obj.file:
            response = HttpResponse(file_obj.file.read(), content_type=file_obj.mime_type)
            response['Content-Disposition'] = f'attachment; filename="{file_obj.original_name}"'
            return response
        
        return Response({'error': 'File not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'])
    def drive_status(self, request):
        """Check Google Drive connection status"""
        return Response({
            'is_configured': drive_oauth_service.is_configured,
            'is_connected': request.user.google_drive_connected,
            'folder_id': drive_oauth_service.get_shared_folder_id()
        })

    @action(detail=False, methods=['get'])
    def drive_files(self, request):
        """List files directly from Google Drive"""
        user = request.user
        if not user.google_drive_connected:
            return Response({'error': 'Google Drive not connected'}, status=status.HTTP_400_BAD_REQUEST)
        
        files = drive_oauth_service.list_files(user.google_drive_token)
        serializer = DriveFileSerializer(files, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def import_from_drive(self, request):
        """Import a file reference from Google Drive"""
        user = request.user
        if not user.google_drive_connected:
            return Response({'error': 'Google Drive not connected'}, status=status.HTTP_400_BAD_REQUEST)
        
        file_id = request.data.get('file_id')
        if not file_id:
            return Response({'error': 'file_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        drive_file = drive_oauth_service.get_file_info(user.google_drive_token, file_id)
        if not drive_file:
            return Response({'error': 'File not found in Drive'}, status=status.HTTP_404_NOT_FOUND)
        
        # Create local reference
        file_obj = File.objects.create(
            company=request.user.active_company,
            created_by=request.user,
            uploaded_by=request.user,
            name=drive_file.get('name'),
            original_name=drive_file.get('name'),
            mime_type=drive_file.get('mimeType', ''),
            size=int(drive_file.get('size', 0)),
            drive_file_id=drive_file.get('id'),
            drive_view_link=drive_file.get('webViewLink'),
            drive_download_link=drive_file.get('webContentLink'),
            is_synced_to_drive=True
        )
        
        return Response(FileSerializer(file_obj).data, status=status.HTTP_201_CREATED)

    def perform_destroy(self, instance):
        """Delete file and also delete from Drive if synced"""
        user = self.request.user
        
        # Delete from Drive if synced
        if instance.is_synced_to_drive and instance.drive_file_id:
            if user.google_drive_connected and user.google_drive_token:
                try:
                    drive_oauth_service.delete_file(user.google_drive_token, instance.drive_file_id)
                except Exception as e:
                    print(f"Error deleting from Drive: {e}")
        
        # Delete local file
        if instance.file:
            instance.file.delete(save=False)
        
        instance.delete()

    @action(detail=True, methods=['post'])
    def copy(self, request, pk=None):
        """Copy a file (and sync copy to Drive if connected)"""
        file_obj = self.get_object()
        user = request.user
        
        # Create copy
        new_name = f"{file_obj.name} (kopya)" if file_obj.name else f"{file_obj.original_name} (kopya)"
        
        new_file = File.objects.create(
            company=file_obj.company,
            folder=file_obj.folder,
            name=new_name,
            original_name=new_name,
            mime_type=file_obj.mime_type,
            size=file_obj.size,
            customer=file_obj.customer,
            project=file_obj.project,
            created_by=user,
            uploaded_by=user
        )
        
        # Copy local file if exists
        if file_obj.file:
            from django.core.files.base import ContentFile
            new_file.file.save(new_name, ContentFile(file_obj.file.read()))
        
        # Copy to Drive if connected and original is synced
        if user.google_drive_connected and user.google_drive_token:
            if file_obj.is_synced_to_drive and file_obj.drive_file_id:
                # Download from Drive and re-upload as copy
                content = drive_oauth_service.download_file(user.google_drive_token, file_obj.drive_file_id)
                if content:
                    result = drive_oauth_service.upload_file(
                        user.google_drive_token,
                        content,
                        new_name,
                        file_obj.mime_type
                    )
                    if result:
                        new_file.drive_file_id = result.get('id')
                        new_file.drive_view_link = result.get('webViewLink')
                        new_file.drive_download_link = result.get('webContentLink')
                        new_file.is_synced_to_drive = True
                        new_file.save()
        
        return Response(FileSerializer(new_file).data, status=status.HTTP_201_CREATED)



class FileShareViewSet(viewsets.ModelViewSet):
    queryset = FileShare.objects.all()
    serializer_class = FileShareSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['file', 'shared_with']

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return FileShare.objects.all()
        return FileShare.objects.filter(file__company=user.active_company)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
