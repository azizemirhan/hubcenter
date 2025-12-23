"""
Google Drive Service using Service Account
Requires: google-api-python-client, google-auth
"""
import os
import io
from typing import Optional, List, Dict, Any
from django.conf import settings
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload, MediaIoBaseDownload, MediaIoBaseUpload


class GoogleDriveService:
    """Google Drive API wrapper using Service Account"""
    
    SCOPES = ['https://www.googleapis.com/auth/drive']
    
    def __init__(self):
        self.credentials = None
        self.service = None
        self._initialize()
    
    def _initialize(self):
        """Initialize Google Drive service"""
        credentials_path = getattr(settings, 'GOOGLE_DRIVE_CREDENTIALS_PATH', None)
        
        if credentials_path and os.path.exists(credentials_path):
            self.credentials = service_account.Credentials.from_service_account_file(
                credentials_path,
                scopes=self.SCOPES
            )
            self.service = build('drive', 'v3', credentials=self.credentials)
        else:
            # Try environment variable with JSON content
            credentials_json = getattr(settings, 'GOOGLE_DRIVE_CREDENTIALS_JSON', None)
            if credentials_json:
                import json
                creds_dict = json.loads(credentials_json)
                self.credentials = service_account.Credentials.from_service_account_info(
                    creds_dict,
                    scopes=self.SCOPES
                )
                self.service = build('drive', 'v3', credentials=self.credentials)
    
    @property
    def is_configured(self) -> bool:
        """Check if service is properly configured"""
        return self.service is not None
    
    def get_shared_folder_id(self) -> Optional[str]:
        """Get the shared folder ID from settings"""
        return getattr(settings, 'GOOGLE_DRIVE_FOLDER_ID', None)
    
    def list_files(self, folder_id: Optional[str] = None, page_size: int = 100) -> List[Dict]:
        """List files in a folder"""
        if not self.is_configured:
            return []
        
        folder_id = folder_id or self.get_shared_folder_id()
        query = f"'{folder_id}' in parents and trashed=false" if folder_id else "trashed=false"
        
        try:
            results = self.service.files().list(
                q=query,
                pageSize=page_size,
                fields="nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink)"
            ).execute()
            return results.get('files', [])
        except Exception as e:
            print(f"Error listing files: {e}")
            return []
    
    def upload_file(self, file_content: bytes, filename: str, mime_type: str, 
                    folder_id: Optional[str] = None) -> Optional[Dict]:
        """Upload a file to Google Drive"""
        if not self.is_configured:
            return None
        
        folder_id = folder_id or self.get_shared_folder_id()
        
        file_metadata = {'name': filename}
        if folder_id:
            file_metadata['parents'] = [folder_id]
        
        try:
            media = MediaIoBaseUpload(
                io.BytesIO(file_content),
                mimetype=mime_type,
                resumable=True
            )
            file = self.service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id, name, mimeType, size, webViewLink, webContentLink',
                supportsAllDrives=True
            ).execute()
            return file
        except Exception as e:
            print(f"Error uploading file: {e}")
            return None

    
    def download_file(self, file_id: str) -> Optional[bytes]:
        """Download a file from Google Drive"""
        if not self.is_configured:
            return None
        
        try:
            request = self.service.files().get_media(fileId=file_id)
            file_buffer = io.BytesIO()
            downloader = MediaIoBaseDownload(file_buffer, request)
            
            done = False
            while not done:
                status, done = downloader.next_chunk()
            
            return file_buffer.getvalue()
        except Exception as e:
            print(f"Error downloading file: {e}")
            return None
    
    def delete_file(self, file_id: str) -> bool:
        """Delete a file from Google Drive"""
        if not self.is_configured:
            return False
        
        try:
            self.service.files().delete(fileId=file_id).execute()
            return True
        except Exception as e:
            print(f"Error deleting file: {e}")
            return False
    
    def create_folder(self, folder_name: str, parent_id: Optional[str] = None) -> Optional[Dict]:
        """Create a folder in Google Drive"""
        if not self.is_configured:
            return None
        
        parent_id = parent_id or self.get_shared_folder_id()
        
        file_metadata = {
            'name': folder_name,
            'mimeType': 'application/vnd.google-apps.folder'
        }
        if parent_id:
            file_metadata['parents'] = [parent_id]
        
        try:
            folder = self.service.files().create(
                body=file_metadata,
                fields='id, name'
            ).execute()
            return folder
        except Exception as e:
            print(f"Error creating folder: {e}")
            return None
    
    def get_file_info(self, file_id: str) -> Optional[Dict]:
        """Get file metadata"""
        if not self.is_configured:
            return None
        
        try:
            file = self.service.files().get(
                fileId=file_id,
                fields='id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink'
            ).execute()
            return file
        except Exception as e:
            print(f"Error getting file info: {e}")
            return None


# Singleton instance
drive_service = GoogleDriveService()
