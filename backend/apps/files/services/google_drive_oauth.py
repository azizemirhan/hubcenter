"""
Google Drive Service using OAuth 2.0
Requires: google-api-python-client, google-auth, google-auth-oauthlib
"""
import os
import io
import json
from typing import Optional, List, Dict
from django.conf import settings
from django.core.cache import cache
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload, MediaIoBaseUpload


class GoogleDriveOAuthService:
    """Google Drive API wrapper using OAuth 2.0"""
    
    SCOPES = [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive'
    ]
    
    def __init__(self):
        self.client_config = None
        self._load_client_config()
    
    def _load_client_config(self):
        """Load OAuth client configuration"""
        credentials_path = getattr(settings, 'GOOGLE_OAUTH_CREDENTIALS_PATH', None)
        
        if credentials_path and os.path.exists(credentials_path):
            with open(credentials_path, 'r') as f:
                self.client_config = json.load(f)
    
    @property
    def is_configured(self) -> bool:
        """Check if OAuth is configured"""
        return self.client_config is not None
    
    def get_authorization_url(self, redirect_uri: str, state: str = None) -> tuple:
        """Generate OAuth authorization URL"""
        if not self.is_configured:
            return None, None
        
        flow = Flow.from_client_config(
            self.client_config,
            scopes=self.SCOPES,
            redirect_uri=redirect_uri
        )
        
        authorization_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent',
            state=state
        )
        
        return authorization_url, state
    
    def exchange_code(self, code: str, redirect_uri: str) -> Optional[Dict]:
        """Exchange authorization code for tokens"""
        if not self.is_configured:
            return None
        
        try:
            flow = Flow.from_client_config(
                self.client_config,
                scopes=self.SCOPES,
                redirect_uri=redirect_uri
            )
            flow.fetch_token(code=code)
            
            credentials = flow.credentials
            return {
                'access_token': credentials.token,
                'refresh_token': credentials.refresh_token,
                'token_uri': credentials.token_uri,
                'client_id': credentials.client_id,
                'client_secret': credentials.client_secret,
                'scopes': list(credentials.scopes)
            }
        except Exception as e:
            print(f"Error exchanging code: {e}")
            return None
    
    def get_credentials(self, token_data: Dict) -> Optional[Credentials]:
        """Get Credentials object from token data"""
        if not token_data:
            return None
        
        credentials = Credentials(
            token=token_data.get('access_token'),
            refresh_token=token_data.get('refresh_token'),
            token_uri=token_data.get('token_uri', 'https://oauth2.googleapis.com/token'),
            client_id=token_data.get('client_id'),
            client_secret=token_data.get('client_secret'),
            scopes=token_data.get('scopes', self.SCOPES)
        )
        
        # Refresh if expired
        if credentials.expired and credentials.refresh_token:
            try:
                credentials.refresh(Request())
            except Exception as e:
                print(f"Error refreshing token: {e}")
                return None
        
        return credentials
    
    def get_service(self, token_data: Dict):
        """Get Google Drive service for user"""
        credentials = self.get_credentials(token_data)
        if not credentials:
            return None
        return build('drive', 'v3', credentials=credentials)
    
    def get_shared_folder_id(self) -> Optional[str]:
        """Get the shared folder ID from settings"""
        return getattr(settings, 'GOOGLE_DRIVE_FOLDER_ID', None)
    
    def list_files(self, token_data: Dict, folder_id: Optional[str] = None) -> List[Dict]:
        """List files in Drive"""
        service = self.get_service(token_data)
        if not service:
            return []
        
        folder_id = folder_id or self.get_shared_folder_id()
        query = f"'{folder_id}' in parents and trashed=false" if folder_id else "trashed=false"
        
        try:
            results = service.files().list(
                q=query,
                pageSize=100,
                fields="files(id, name, mimeType, size, createdTime, webViewLink, webContentLink)"
            ).execute()
            return results.get('files', [])
        except Exception as e:
            print(f"Error listing files: {e}")
            return []
    
    def upload_file(self, token_data: Dict, file_content: bytes, filename: str, 
                    mime_type: str, folder_id: Optional[str] = None) -> Optional[Dict]:
        """Upload a file to Google Drive"""
        service = self.get_service(token_data)
        if not service:
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
            file = service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id, name, mimeType, size, webViewLink, webContentLink'
            ).execute()
            return file
        except Exception as e:
            print(f"Error uploading file: {e}")
            return None
    
    def download_file(self, token_data: Dict, file_id: str) -> Optional[bytes]:
        """Download a file from Google Drive"""
        service = self.get_service(token_data)
        if not service:
            return None
        
        try:
            request = service.files().get_media(fileId=file_id)
            file_buffer = io.BytesIO()
            downloader = MediaIoBaseDownload(file_buffer, request)
            
            done = False
            while not done:
                status, done = downloader.next_chunk()
            
            return file_buffer.getvalue()
        except Exception as e:
            print(f"Error downloading file: {e}")
            return None
    
    def create_folder(self, token_data: Dict, folder_name: str, 
                      parent_id: Optional[str] = None) -> Optional[Dict]:
        """Create a folder in Google Drive"""
        service = self.get_service(token_data)
        if not service:
            return None
        
        parent_id = parent_id or self.get_shared_folder_id()
        
        file_metadata = {
            'name': folder_name,
            'mimeType': 'application/vnd.google-apps.folder'
        }
        if parent_id:
            file_metadata['parents'] = [parent_id]
        
        try:
            folder = service.files().create(
                body=file_metadata,
                fields='id, name'
            ).execute()
            return folder
        except Exception as e:
            print(f"Error creating folder: {e}")
            return None
    
    def get_file_info(self, token_data: Dict, file_id: str) -> Optional[Dict]:
        """Get file metadata"""
        service = self.get_service(token_data)
        if not service:
            return None
        
        try:
            file = service.files().get(
                fileId=file_id,
                fields='id, name, mimeType, size, webViewLink, webContentLink'
            ).execute()
            return file
        except Exception as e:
            print(f"Error getting file info: {e}")
            return None

    def delete_file(self, token_data: Dict, file_id: str) -> bool:
        """Delete a file from Google Drive"""
        service = self.get_service(token_data)
        if not service:
            return False
        
        try:
            service.files().delete(fileId=file_id).execute()
            return True
        except Exception as e:
            print(f"Error deleting file: {e}")
            return False


# Singleton instance
drive_oauth_service = GoogleDriveOAuthService()

