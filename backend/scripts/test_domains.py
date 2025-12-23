import urllib.request
import urllib.parse
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

BASE_URL = "http://localhost:8000/api/v1"
EMAIL = "test@example.com"
PASSWORD = "password123"

def make_request(url, method='GET', data=None, headers=None):
    if headers is None:
        headers = {}
    
    if data is not None:
        data = json.dumps(data).encode('utf-8')
        headers['Content-Type'] = 'application/json'

    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, context=ctx) as response:
            return response.status, response.read().decode('utf-8')
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8')
    except Exception as e:
        return 0, str(e)

def test_domains():
    print(f"Logging in as {EMAIL}...")
    status, body = make_request(f"{BASE_URL}/auth/login/", 'POST', {'email': EMAIL, 'password': PASSWORD})
    if status != 200:
        print(f"Login failed: {status}")
        return
    
    token = json.loads(body)['access']
    headers = {'Authorization': f'Bearer {token}'}
    print("Login successful.")

    # Switch company
    make_request(f"{BASE_URL}/organization/companies/test-main/switch/", 'POST', headers=headers)

    # Need a customer first
    print("\nCreating a test customer...")
    cust_data = {'company_name': 'Domain Test Inc', 'contact_person': 'Ali', 'phone': '5551234567'}
    status, body = make_request(f"{BASE_URL}/customers/list/", 'POST', cust_data, headers)
    print(f"Customer Status: {status}")
    if status == 201:
        customer_id = json.loads(body)['id']
    else:
        # Try to get existing
        status, body = make_request(f"{BASE_URL}/customers/list/", 'GET', headers=headers)
        customers = json.loads(body)
        if isinstance(customers, dict):
            customers = customers.get('results', [])
        customer_id = customers[0]['id'] if customers else None

    if not customer_id:
        print("No customer available")
        return

    # Test Create Domain
    print("\nCreating a test domain...")
    domain_data = {
        'customer': customer_id,
        'domain_name': 'testdomain.com',
        'registrar': 'GoDaddy',
        'register_date': '2024-01-15',
        'expire_date': '2025-01-15',
        'auto_renew': True
    }
    status, body = make_request(f"{BASE_URL}/domains/list/", 'POST', domain_data, headers)
    print(f"Domain Status: {status}")
    print(body[:300] if len(body) > 300 else body)

    # Test Domain Summary
    print("\nFetching domain summary...")
    status, body = make_request(f"{BASE_URL}/domains/list/summary/", 'GET', headers=headers)
    print(f"Summary Status: {status}")
    print(body)

    # Test Create Hosting
    print("\nCreating a test hosting...")
    hosting_data = {
        'customer': customer_id,
        'provider': 'DigitalOcean',
        'plan_name': 'Basic Droplet',
        'server_ip': '192.168.1.100',
        'start_date': '2024-01-01',
        'expire_date': '2025-01-01',
        'monthly_cost': '250.00'
    }
    status, body = make_request(f"{BASE_URL}/domains/hosting/", 'POST', hosting_data, headers)
    print(f"Hosting Status: {status}")
    print(body[:300] if len(body) > 300 else body)

    # Test Hosting Summary
    print("\nFetching hosting summary...")
    status, body = make_request(f"{BASE_URL}/domains/hosting/summary/", 'GET', headers=headers)
    print(f"Summary Status: {status}")
    print(body)

if __name__ == "__main__":
    test_domains()
