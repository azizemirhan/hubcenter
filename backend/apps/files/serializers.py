from rest_framework import serializers
from .models import Folder, File, FileShare


class FolderSerializer(serializers.ModelSerializer):
    file_count = serializers.SerializerMethodField()
    subfolder_count = serializers.SerializerMethodField()

    class Meta:
        model = Folder
        fields = [
            'id', 'parent', 'name', 'folder_type', 'customer', 'project',
            'file_count', 'subfolder_count', 'created_at'
        ]
        read_only_fields = ['id', 'file_count', 'subfolder_count', 'created_at']

    def get_file_count(self, obj):
        return obj.files.count()

    def get_subfolder_count(self, obj):
        return obj.subfolders.count()


class FileSerializer(serializers.ModelSerializer):
    folder_name = serializers.CharField(source='folder.name', read_only=True)
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    customer_name = serializers.CharField(source='customer.company_name', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    size_display = serializers.SerializerMethodField()

    class Meta:
        model = File
        fields = [
            'id', 'folder', 'folder_name', 'name', 'original_name', 'file',
            'size', 'size_display', 'mime_type', 'customer', 'customer_name',
            'project', 'project_name', 'uploaded_by', 'uploaded_by_name',
            'is_public', 'download_count',
            'drive_file_id', 'drive_view_link', 'drive_download_link', 'is_synced_to_drive',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'folder_name', 'uploaded_by_name', 'customer_name',
                           'project_name', 'size_display', 'download_count', 'size',
                           'original_name', 'mime_type', 'uploaded_by',
                           'drive_file_id', 'drive_view_link', 'drive_download_link',
                           'is_synced_to_drive', 'created_at', 'updated_at']

    def get_size_display(self, obj):
        size = obj.size
        if size < 1024:
            return f"{size} B"
        elif size < 1024 * 1024:
            return f"{size / 1024:.1f} KB"
        else:
            return f"{size / (1024 * 1024):.1f} MB"


class FileListSerializer(serializers.ModelSerializer):
    folder_name = serializers.CharField(source='folder.name', read_only=True)
    size_display = serializers.SerializerMethodField()

    class Meta:
        model = File
        fields = [
            'id', 'folder', 'folder_name', 'name', 'original_name',
            'size', 'size_display', 'mime_type', 'is_synced_to_drive',
            'drive_view_link', 'created_at'
        ]

    def get_size_display(self, obj):
        size = obj.size
        if size < 1024:
            return f"{size} B"
        elif size < 1024 * 1024:
            return f"{size / 1024:.1f} KB"
        else:
            return f"{size / (1024 * 1024):.1f} MB"


class FileShareSerializer(serializers.ModelSerializer):
    file_name = serializers.CharField(source='file.name', read_only=True)
    shared_with_name = serializers.CharField(source='shared_with.get_full_name', read_only=True)
    permission_display = serializers.CharField(source='get_permission_display', read_only=True)

    class Meta:
        model = FileShare
        fields = [
            'id', 'file', 'file_name', 'shared_with', 'shared_with_name',
            'permission', 'permission_display', 'expires_at', 'created_at'
        ]
        read_only_fields = ['id', 'file_name', 'shared_with_name', 'permission_display', 'created_at']


class DriveFileSerializer(serializers.Serializer):
    """Serializer for Google Drive file listing"""
    id = serializers.CharField()
    name = serializers.CharField()
    mimeType = serializers.CharField()
    size = serializers.CharField(required=False)
    createdTime = serializers.CharField(required=False)
    modifiedTime = serializers.CharField(required=False)
    webViewLink = serializers.CharField(required=False)
    webContentLink = serializers.CharField(required=False)
