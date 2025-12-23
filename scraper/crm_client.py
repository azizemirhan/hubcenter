"""
CRM API Client

This module handles communication with the CRM backend API to:
- Create or update customers
- Create or update domains 
- Create or update hosting records
"""
import requests
import os
from typing import Dict, Any, Optional, List

from config import CRM_API_URL


class CRMClient:
    """Client for CRM API interactions"""
    
    def __init__(self, api_url: str = None, email: str = None, password: str = None):
        self.api_url = (api_url or CRM_API_URL).rstrip('/')
        self.email = email or os.getenv('CRM_EMAIL', '')
        self.password = password or os.getenv('CRM_PASSWORD', '')
        self.access_token = None
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
        })
    
    def login(self) -> bool:
        """
        Login to CRM API and get JWT access token
        """
        print("🔐 CRM'e giriş yapılıyor...")
        
        try:
            response = self.session.post(
                f"{self.api_url}/v1/auth/login/",
                json={
                    'email': self.email,
                    'password': self.password
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                self.access_token = data.get('access')
                self.session.headers['Authorization'] = f'Bearer {self.access_token}'
                print("✅ CRM giriş başarılı!")
                return True
            else:
                print(f"❌ CRM giriş başarısız: {response.status_code}")
                print(f"   Detay: {response.text[:200]}")
                return False
                
        except Exception as e:
            print(f"❌ CRM bağlantı hatası: {e}")
            return False
    
    def _request(self, method: str, endpoint: str, data: Dict = None) -> Dict:
        """Make API request"""
        url = f"{self.api_url}/{endpoint.lstrip('/')}"
        
        try:
            response = self.session.request(method, url, json=data)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            print(f"❌ API Hatası: {e}")
            if response.text:
                print(f"   Detay: {response.text[:200]}")
            raise
        except Exception as e:
            print(f"❌ Bağlantı Hatası: {e}")
            raise
    
    def get_customers(self) -> List[Dict]:
        """Get all customers"""
        return self._request('GET', 'v1/customers/list/')
    
    def find_customer_by_website(self, website: str) -> Optional[Dict]:
        """Find customer by website URL or domain"""
        try:
            result = self._request('GET', f'v1/customers/list/?search={website}')
            customers = result.get('results', result) if isinstance(result, dict) else result
            if customers and len(customers) > 0:
                return customers[0]
        except:
            pass
        return None
    
    def create_customer(self, data: Dict[str, Any]) -> Dict:
        """
        Create a new customer
        
        Required fields:
        - company_name
        - contact_person
        - email
        - phone
        """
        return self._request('POST', 'v1/customers/list/', data)
    
    def update_customer(self, customer_id: int, data: Dict[str, Any]) -> Dict:
        """Update existing customer"""
        return self._request('PATCH', f'v1/customers/{customer_id}/', data)
    
    def create_or_update_customer(self, domain: str, data: Dict[str, Any]) -> Dict:
        """
        Create customer if not exists, otherwise update
        Uses website/domain to match existing customers
        """
        # First try to find existing customer by website
        existing = self.find_customer_by_website(domain)
        
        if existing:
            print(f"   📝 Mevcut müşteri güncelleniyor: {existing.get('company_name')}")
            return self.update_customer(existing['id'], data)
        else:
            print(f"   ➕ Yeni müşteri oluşturuluyor: {data.get('company_name', domain)}")
            return self.create_customer(data)
    
    # Domain methods
    def get_domains(self, customer_id: int = None) -> List[Dict]:
        """Get domains, optionally filtered by customer"""
        endpoint = 'domains/'
        if customer_id:
            endpoint = f'domains/?customer={customer_id}'
        return self._request('GET', endpoint)
    
    def create_domain(self, data: Dict[str, Any]) -> Dict:
        """Create a new domain record"""
        return self._request('POST', 'domains/', data)
    
    def update_domain(self, domain_id: int, data: Dict[str, Any]) -> Dict:
        """Update existing domain"""
        return self._request('PATCH', f'domains/{domain_id}/', data)
    
    # Hosting methods
    def get_hostings(self, customer_id: int = None) -> List[Dict]:
        """Get hosting records, optionally filtered by customer"""
        endpoint = 'hostings/'
        if customer_id:
            endpoint = f'hostings/?customer={customer_id}'
        return self._request('GET', endpoint)
    
    def create_hosting(self, data: Dict[str, Any]) -> Dict:
        """Create a new hosting record"""
        return self._request('POST', 'hostings/', data)
    
    def update_hosting(self, hosting_id: int, data: Dict[str, Any]) -> Dict:
        """Update existing hosting"""
        return self._request('PATCH', f'hostings/{hosting_id}/', data)
    
    def create_or_update_hosting(self, customer_id: int, domain: str, data: Dict[str, Any]) -> Dict:
        """Create or update hosting record for a customer"""
        # Check if hosting already exists for this customer
        hostings = self.get_hostings(customer_id)
        
        for hosting in hostings:
            # Match by domain in notes or similar field
            if domain in str(hosting.get('notes', '')):
                print(f"   📝 Mevcut hosting güncelleniyor")
                return self.update_hosting(hosting['id'], data)
        
        # Create new
        data['customer'] = customer_id
        print(f"   ➕ Yeni hosting kaydı oluşturuluyor")
        return self.create_hosting(data)
    
    def test_connection(self) -> bool:
        """Test API connection by logging in"""
        if not self.access_token:
            if not self.login():
                return False
        
        try:
            self._request('GET', 'v1/customers/list/?limit=1')
            print("✅ CRM API bağlantısı başarılı")
            return True
        except:
            print("❌ CRM API bağlantısı başarısız")
            return False


def prepare_customer_data(
    domain: str,
    siteground_data: Dict = None,
    website_data: Dict = None
) -> Dict[str, Any]:
    """
    Prepare customer data from scraped information
    
    Args:
        domain: The website domain
        siteground_data: Data from SiteGround scraper
        website_data: Data from website scraper
    """
    data = {
        'website': f'https://{domain}',
        'has_hosting_service': True,
        'source': 'website',
    }
    
    # From SiteGround data
    if siteground_data:
        if siteground_data.get('has_wordpress'):
            data['has_web_design_service'] = True
        data['notes'] = f"SiteGround Hosting\nPlan: {siteground_data.get('plan', 'N/A')}\nDisk: {siteground_data.get('disk_space', 'N/A')}"
    
    # From website scraper
    if website_data:
        if website_data.get('company_name'):
            data['company_name'] = website_data['company_name']
        else:
            # Use domain as company name fallback
            data['company_name'] = domain.replace('.com', '').replace('.tr', '').replace('.', ' ').title()
        
        if website_data.get('phones'):
            data['phone'] = website_data['phones'][0]
            if len(website_data['phones']) > 1:
                data['secondary_phone'] = website_data['phones'][1]
        else:
            data['phone'] = ''  # Required field
        
        if website_data.get('emails'):
            data['email'] = website_data['emails'][0]
            if len(website_data['emails']) > 1:
                data['secondary_email'] = website_data['emails'][1]
        else:
            data['email'] = f'info@{domain}'  # Default email
        
        if website_data.get('address'):
            data['address'] = website_data['address']
        
        # Add contact person from email if possible
        email = data.get('email', '')
        if email and '@' in email:
            local_part = email.split('@')[0]
            if '.' in local_part:
                # john.doe@example.com -> John Doe
                parts = local_part.split('.')
                data['contact_person'] = ' '.join(p.title() for p in parts)
            elif local_part not in ['info', 'contact', 'sales', 'support', 'hello']:
                data['contact_person'] = local_part.title()
        
        if not data.get('contact_person'):
            data['contact_person'] = 'Yetkili Kişi'  # Required field
        
        # Social media
        social = website_data.get('social', {})
        if social.get('facebook'):
            data['facebook'] = social['facebook']
        if social.get('instagram'):
            data['instagram'] = social['instagram']
        if social.get('linkedin'):
            data['linkedin'] = social['linkedin']
        if social.get('twitter'):
            data['twitter'] = social['twitter']
    else:
        # Minimum required fields
        data['company_name'] = domain.replace('.com', '').replace('.tr', '').title()
        data['contact_person'] = 'Yetkili Kişi'
        data['email'] = f'info@{domain}'
        data['phone'] = ''
    
    return data


def main():
    """Test CRM client"""
    client = CRMClient()
    
    print("CRM API Test")
    print("="*50)
    
    if client.test_connection():
        print("\nMüşteri listesi çekiliyor...")
        customers = client.get_customers()
        print(f"Toplam {len(customers)} müşteri bulundu")
        
        if customers:
            print("\nİlk 3 müşteri:")
            for c in customers[:3]:
                print(f"  - {c.get('company_name')} ({c.get('email')})")


if __name__ == '__main__':
    main()
