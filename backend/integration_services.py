# integration_services.py
# Integration services for OneDrive and Azure DevOps

import os
import requests
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import base64
from urllib.parse import urlencode
import msal
from azure.devops.connection import Connection
from msrest.authentication import BasicAuthentication
import uuid

class OneDriveService:
    """OneDrive integration service - Multi-tenant support"""
    
    def __init__(self):
        self.client_id = os.getenv('ONEDRIVE_CLIENT_ID')
        self.redirect_uri = os.getenv('ONEDRIVE_REDIRECT_URI', 'http://localhost:3000/auth/callback')
        self.authority = os.getenv('ONEDRIVE_AUTHORITY', 'https://login.microsoftonline.com/common')
        self.scopes = ['https://graph.microsoft.com/Files.Read.All', 'https://graph.microsoft.com/User.Read']
        
        # Multi-tenant configuration
        if self.client_id:
            self.app = msal.PublicClientApplication(
                self.client_id,
                authority=self.authority
            )
            print("✅ Multi-tenant OneDrive integration configured")
        else:
            self.app = None
            print("⚠️ OneDrive integration not configured (missing CLIENT_ID)")
    
    def get_auth_url(self, state: str = None) -> str:
        """Get authorization URL for user to sign in"""
        if not self.app:
            return None
            
        auth_url = self.app.get_authorization_request_url(
            scopes=self.scopes,
            redirect_uri=self.redirect_uri,
            state=state
        )
        return auth_url
    
    def acquire_token_by_auth_code(self, auth_code: str) -> Optional[Dict]:
        """Exchange authorization code for access token"""
        if not self.app:
            return None
            
        try:
            result = self.app.acquire_token_by_authorization_code(
                code=auth_code,
                scopes=self.scopes,
                redirect_uri=self.redirect_uri
            )
            
            if "access_token" in result:
                return result
            else:
                print(f"❌ Error acquiring token: {result.get('error_description', 'Unknown error')}")
                return None
        except Exception as e:
            print(f"❌ Error in acquire_token_by_auth_code: {e}")
            return None
    
    def get_access_token(self, user_token_data: Dict = None) -> Optional[str]:
        """Get access token for Microsoft Graph API"""
        if not user_token_data:
            print("❌ User token data required for multi-tenant OneDrive")
            return None
            
        try:
            # Check if token is expired
            expires_at = user_token_data.get('expires_at', 0)
            if time.time() >= expires_at:
                # Token expired, need to refresh
                if 'refresh_token' in user_token_data:
                    result = self.app.acquire_token_by_refresh_token(
                        refresh_token=user_token_data['refresh_token'],
                        scopes=self.scopes
                    )
                    if "access_token" in result:
                        return result["access_token"]
                
                print("❌ Token expired and refresh failed")
                return None
            
            return user_token_data.get('access_token')
            
        except Exception as e:
            print(f"❌ Error in get_access_token: {e}")
            return None
    
    def list_files(self, folder_id: str = None, drive_id: str = None, user_token_data: Dict = None) -> List[Dict]:
        """List files from OneDrive"""
        try:
            access_token = self.get_access_token(user_token_data)
            if not access_token:
                return []
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            # Build URL
            if folder_id:
                url = f"https://graph.microsoft.com/v1.0/me/drive/items/{folder_id}/children"
            elif drive_id:
                url = f"https://graph.microsoft.com/v1.0/me/drives/{drive_id}/root/children"
            else:
                url = "https://graph.microsoft.com/v1.0/me/drive/root/children"
            
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            files = []
            
            for item in data.get('value', []):
                if item.get('file'):  # Only files, not folders
                    files.append({
                        'id': item['id'],
                        'name': item['name'],
                        'size': item.get('size', 0),
                        'last_modified': item.get('lastModifiedDateTime'),
                        'download_url': item.get('@microsoft.graph.downloadUrl'),
                        'file_type': item['name'].split('.')[-1].lower() if '.' in item['name'] else ''
                    })
                elif item.get('folder'):  # Include folders too
                    files.append({
                        'id': item['id'],
                        'name': item['name'],
                        'folder': True,
                        'item_count': item.get('folder', {}).get('childCount', 0)
                    })
            
            return files
            
        except Exception as e:
            print(f"❌ Error listing OneDrive files: {e}")
            return []
    
    def download_file(self, file_id: str, user_token_data: Dict = None) -> Optional[bytes]:
        """Download file from OneDrive"""
        try:
            access_token = self.get_access_token(user_token_data)
            if not access_token:
                return None
            
            headers = {
                'Authorization': f'Bearer {access_token}'
            }
            
            # Get file content
            url = f"https://graph.microsoft.com/v1.0/me/drive/items/{file_id}/content"
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            
            return response.content
            
        except Exception as e:
            print(f"❌ Error downloading OneDrive file: {e}")
            return None
    
    def upload_file(self, file_path: str, file_name: str, folder_id: str = None) -> Optional[Dict]:
        """Upload file to OneDrive"""
        try:
            access_token = self.get_access_token()
            if not access_token:
                return None
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/octet-stream'
            }
            
            # Read file content
            with open(file_path, 'rb') as f:
                file_content = f.read()
            
            # Build URL
            if folder_id:
                url = f"https://graph.microsoft.com/v1.0/me/drive/items/{folder_id}:/{file_name}:/content"
            else:
                url = f"https://graph.microsoft.com/v1.0/me/drive/root:/{file_name}:/content"
            
            response = requests.put(url, headers=headers, data=file_content)
            response.raise_for_status()
            
            return response.json()
            
        except Exception as e:
            print(f"❌ Error uploading to OneDrive: {e}")
            return None
    
    def create_folder(self, folder_name: str, parent_id: str = None) -> Optional[Dict]:
        """Create folder in OneDrive"""
        try:
            access_token = self.get_access_token()
            if not access_token:
                return None
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            data = {
                "name": folder_name,
                "folder": {},
                "@microsoft.graph.conflictBehavior": "rename"
            }
            
            # Build URL
            if parent_id:
                url = f"https://graph.microsoft.com/v1.0/me/drive/items/{parent_id}/children"
            else:
                url = "https://graph.microsoft.com/v1.0/me/drive/root/children"
            
            response = requests.post(url, headers=headers, json=data)
            response.raise_for_status()
            
            return response.json()
            
        except Exception as e:
            print(f"❌ Error creating OneDrive folder: {e}")
            return None

class AzureDevOpsService:
    """Azure DevOps integration service"""
    
    def __init__(self, organization_url: str, personal_access_token: str):
        self.organization_url = organization_url
        self.pat_token = personal_access_token
        self.credentials = BasicAuthentication('', personal_access_token)
        self.connection = Connection(base_url=organization_url, creds=self.credentials)
    
    def get_projects(self) -> List[Dict]:
        """Get all projects in the organization"""
        try:
            core_client = self.connection.clients.get_core_client()
            projects = core_client.get_projects()
            
            return [
                {
                    'id': project.id,
                    'name': project.name,
                    'description': project.description,
                    'state': project.state,
                    'visibility': project.visibility
                }
                for project in projects
            ]
            
        except Exception as e:
            print(f"❌ Error getting Azure DevOps projects: {e}")
            return []
    
    def get_work_items(self, project_id: str, query: str = None) -> List[Dict]:
        """Get work items from a project"""
        try:
            wit_client = self.connection.clients.get_work_item_tracking_client()
            
            if query:
                # Use custom query
                wiql_query = query
            else:
                # Default query to get all user stories, features, and epics
                wiql_query = f"""
                SELECT [System.Id], [System.Title], [System.Description], [System.WorkItemType], [System.State]
                FROM WorkItems
                WHERE [System.TeamProject] = '{project_id}'
                AND [System.WorkItemType] IN ('User Story', 'Feature', 'Epic', 'Requirement')
                ORDER BY [System.ChangedDate] DESC
                """
            
            wiql_results = wit_client.query_by_wiql(wiql_query)
            
            work_items = []
            if wiql_results.work_items:
                # Get detailed information for each work item
                work_item_ids = [wi.id for wi in wiql_results.work_items]
                detailed_items = wit_client.get_work_items(work_item_ids)
                
                for item in detailed_items:
                    work_items.append({
                        'id': item.id,
                        'title': item.fields.get('System.Title', ''),
                        'description': item.fields.get('System.Description', ''),
                        'type': item.fields.get('System.WorkItemType', ''),
                        'state': item.fields.get('System.State', ''),
                        'assigned_to': item.fields.get('System.AssignedTo', {}).get('displayName', ''),
                        'created_date': item.fields.get('System.CreatedDate', ''),
                        'changed_date': item.fields.get('System.ChangedDate', ''),
                        'priority': item.fields.get('Microsoft.VSTS.Common.Priority', ''),
                        'area_path': item.fields.get('System.AreaPath', ''),
                        'iteration_path': item.fields.get('System.IterationPath', '')
                    })
            
            return work_items
            
        except Exception as e:
            print(f"❌ Error getting Azure DevOps work items: {e}")
            return []
    
    def get_work_item_by_id(self, work_item_id: int) -> Optional[Dict]:
        """Get specific work item by ID"""
        try:
            wit_client = self.connection.clients.get_work_item_tracking_client()
            work_item = wit_client.get_work_item(work_item_id)
            
            return {
                'id': work_item.id,
                'title': work_item.fields.get('System.Title', ''),
                'description': work_item.fields.get('System.Description', ''),
                'type': work_item.fields.get('System.WorkItemType', ''),
                'state': work_item.fields.get('System.State', ''),
                'assigned_to': work_item.fields.get('System.AssignedTo', {}).get('displayName', ''),
                'created_date': work_item.fields.get('System.CreatedDate', ''),
                'changed_date': work_item.fields.get('System.ChangedDate', ''),
                'priority': work_item.fields.get('Microsoft.VSTS.Common.Priority', ''),
                'area_path': work_item.fields.get('System.AreaPath', ''),
                'iteration_path': work_item.fields.get('System.IterationPath', ''),
                'tags': work_item.fields.get('System.Tags', ''),
                'acceptance_criteria': work_item.fields.get('Microsoft.VSTS.Common.AcceptanceCriteria', '')
            }
            
        except Exception as e:
            print(f"❌ Error getting Azure DevOps work item: {e}")
            return None
    
    def create_work_item(self, project_id: str, work_item_type: str, title: str, description: str = None) -> Optional[Dict]:
        """Create a new work item"""
        try:
            wit_client = self.connection.clients.get_work_item_tracking_client()
            
            # Prepare work item fields
            fields = [
                {
                    'op': 'add',
                    'path': '/fields/System.Title',
                    'value': title
                }
            ]
            
            if description:
                fields.append({
                    'op': 'add',
                    'path': '/fields/System.Description',
                    'value': description
                })
            
            # Create work item
            work_item = wit_client.create_work_item(
                document=fields,
                project=project_id,
                type=work_item_type
            )
            
            return {
                'id': work_item.id,
                'url': work_item.url,
                'title': title,
                'type': work_item_type
            }
            
        except Exception as e:
            print(f"❌ Error creating Azure DevOps work item: {e}")
            return None
    
    def update_work_item(self, work_item_id: int, fields: Dict) -> bool:
        """Update an existing work item"""
        try:
            wit_client = self.connection.clients.get_work_item_tracking_client()
            
            # Prepare update operations
            operations = []
            for field_path, value in fields.items():
                operations.append({
                    'op': 'add',
                    'path': f'/fields/{field_path}',
                    'value': value
                })
            
            # Update work item
            wit_client.update_work_item(
                document=operations,
                id=work_item_id
            )
            
            return True
            
        except Exception as e:
            print(f"❌ Error updating Azure DevOps work item: {e}")
            return False
    
    def get_boards(self, project_id: str) -> List[Dict]:
        """Get boards for a project"""
        try:
            work_client = self.connection.clients.get_work_client()
            boards = work_client.get_boards(project_id)
            
            return [
                {
                    'id': board.id,
                    'name': board.name,
                    'url': board.url
                }
                for board in boards
            ]
            
        except Exception as e:
            print(f"❌ Error getting Azure DevOps boards: {e}")
            return []

class IntegrationManager:
    """Manager for all integrations"""
    
    def __init__(self):
        self.onedrive_service = OneDriveService()
        self.ado_services = {}  # Store ADO services per organization
        self.user_onedrive_tokens = {}  # Store user OneDrive tokens
    
    def get_onedrive_auth_url(self, user_id: str, state: str = None) -> str:
        """Get OneDrive authorization URL for user"""
        return self.onedrive_service.get_auth_url(state)
    
    def handle_onedrive_callback(self, user_id: str, auth_code: str) -> bool:
        """Handle OneDrive authorization callback"""
        try:
            token_data = self.onedrive_service.acquire_token_by_auth_code(auth_code)
            if token_data:
                # Add expiration timestamp
                token_data['expires_at'] = time.time() + token_data.get('expires_in', 3600)
                self.user_onedrive_tokens[user_id] = token_data
                return True
            return False
        except Exception as e:
            print(f"❌ Error handling OneDrive callback: {e}")
            return False
    
    def get_onedrive_files(self, folder_id: str = None, user_id: str = None) -> List[Dict]:
        """Get files from OneDrive for specific user"""
        if not user_id:
            return []
        
        user_token = self.user_onedrive_tokens.get(user_id)
        if not user_token:
            return []
        
        return self.onedrive_service.list_files(folder_id, user_token_data=user_token)
    
    def download_onedrive_file(self, file_id: str, user_id: str = None) -> Optional[bytes]:
        """Download file from OneDrive for specific user"""
        if not user_id:
            return None
        
        user_token = self.user_onedrive_tokens.get(user_id)
        if not user_token:
            return None
        
        return self.onedrive_service.download_file(file_id, user_token_data=user_token)
    
    def upload_to_onedrive(self, file_path: str, file_name: str, folder_id: str = None) -> Optional[Dict]:
        """Upload file to OneDrive"""
        return self.onedrive_service.upload_file(file_path, file_name, folder_id)
    
    def create_onedrive_folder(self, folder_name: str, parent_id: str = None) -> Optional[Dict]:
        """Create folder in OneDrive"""
        return self.onedrive_service.create_folder(folder_name, parent_id)
    
    def setup_azure_devops(self, organization_url: str, personal_access_token: str) -> bool:
        """Setup Azure DevOps connection"""
        try:
            ado_service = AzureDevOpsService(organization_url, personal_access_token)
            # Test connection by getting projects
            projects = ado_service.get_projects()
            if projects:
                self.ado_services[organization_url] = ado_service
                return True
            return False
        except Exception as e:
            print(f"❌ Error setting up Azure DevOps: {e}")
            return False
    
    def get_ado_projects(self, organization_url: str) -> List[Dict]:
        """Get projects from Azure DevOps"""
        if organization_url in self.ado_services:
            return self.ado_services[organization_url].get_projects()
        return []
    
    def get_ado_work_items(self, organization_url: str, project_id: str, query: str = None) -> List[Dict]:
        """Get work items from Azure DevOps"""
        if organization_url in self.ado_services:
            return self.ado_services[organization_url].get_work_items(project_id, query)
        return []
    
    def import_requirements_from_ado(self, organization_url: str, project_id: str) -> List[Dict]:
        """Import requirements from Azure DevOps work items"""
        work_items = self.get_ado_work_items(organization_url, project_id)
        
        requirements = []
        for item in work_items:
            if item['type'] in ['User Story', 'Feature', 'Epic', 'Requirement']:
                requirements.append({
                    'source': 'azure_devops',
                    'source_id': item['id'],
                    'title': item['title'],
                    'description': item['description'],
                    'type': item['type'],
                    'priority': item.get('priority', ''),
                    'assigned_to': item.get('assigned_to', ''),
                    'tags': item.get('tags', ''),
                    'acceptance_criteria': item.get('acceptance_criteria', ''),
                    'content': f"# {item['title']}\n\n{item['description']}\n\n**Type:** {item['type']}\n**Priority:** {item.get('priority', 'N/A')}\n**Assigned To:** {item.get('assigned_to', 'N/A')}"
                })
        
        return requirements

# Test function
def test_integrations():
    """Test integration services"""
    print("🧪 Testing Integration Services...")
    
    # Test OneDrive service
    print("\n📁 Testing OneDrive Integration:")
    onedrive = OneDriveService()
    
    # Test Azure DevOps service (requires valid credentials)
    print("\n🔧 Testing Azure DevOps Integration:")
    ado_url = os.getenv('ADO_ORGANIZATION_URL')
    ado_token = os.getenv('ADO_PAT_TOKEN')
    
    if ado_url and ado_token:
        ado_service = AzureDevOpsService(ado_url, ado_token)
        projects = ado_service.get_projects()
        print(f"✅ Found {len(projects)} Azure DevOps projects")
    else:
        print("⚠️ Azure DevOps credentials not configured")
    
    # Test Integration Manager
    print("\n🔗 Testing Integration Manager:")
    manager = IntegrationManager()
    
    if ado_url and ado_token:
        success = manager.setup_azure_devops(ado_url, ado_token)
        print(f"✅ Azure DevOps setup: {success}")
    
    return {
        'onedrive_configured': bool(onedrive.client_id),
        'ado_configured': bool(ado_url and ado_token),
        'projects_count': len(projects) if ado_url and ado_token else 0
    }

if __name__ == "__main__":
    test_integrations()
