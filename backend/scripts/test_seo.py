import urllib.request
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

def test_seo():
    print(f"Logging in as {EMAIL}...")
    status, body = make_request(f"{BASE_URL}/auth/login/", 'POST', {'email': EMAIL, 'password': PASSWORD})
    if status != 200:
        print(f"Login failed: {status}")
        return
    
    token = json.loads(body)['access']
    headers = {'Authorization': f'Bearer {token}'}
    print("Login successful.")

    make_request(f"{BASE_URL}/organization/companies/test-main/switch/", 'POST', headers=headers)

    # Get a customer
    status, body = make_request(f"{BASE_URL}/customers/list/", 'GET', headers=headers)
    customers = json.loads(body)
    if isinstance(customers, dict):
        customers = customers.get('results', [])
    customer_id = customers[0]['id'] if customers else None

    if not customer_id:
        print("No customer available")
        return

    # Test Create SEO Package
    print("\nCreating SEO package...")
    pkg_data = {
        'customer': customer_id,
        'package_type': 'premium',
        'status': 'active',
        'start_date': '2025-01-01',
        'monthly_fee': '3500.00',
        'target_keywords': 'web tasarım\nseo hizmeti\ndijital pazarlama'
    }
    status, body = make_request(f"{BASE_URL}/seo/packages/", 'POST', pkg_data, headers)
    print(f"Package Status: {status}")
    print(body[:400] if len(body) > 400 else body)

    if status == 201:
        package_id = json.loads(body)['id']

        # Test Create Keyword
        print("\nCreating keyword...")
        kw_data = {
            'package': package_id,
            'keyword': 'web tasarım istanbul',
            'search_volume': 1200,
            'difficulty': 45,
            'target_position': 5
        }
        status, body = make_request(f"{BASE_URL}/seo/keywords/", 'POST', kw_data, headers)
        print(f"Keyword Status: {status}")
        print(body[:200] if len(body) > 200 else body)

    # Test Summary
    print("\nFetching SEO summary...")
    status, body = make_request(f"{BASE_URL}/seo/packages/summary/", 'GET', headers=headers)
    print(f"Summary Status: {status}")
    print(body)

if __name__ == "__main__":
    test_seo()
