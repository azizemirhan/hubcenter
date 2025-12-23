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

def test_projects():
    print(f"Logging in as {EMAIL}...")
    status, body = make_request(f"{BASE_URL}/auth/login/", 'POST', {'email': EMAIL, 'password': PASSWORD})
    if status != 200:
        print(f"Login failed: {status}")
        print(body)
        return
    
    token = json.loads(body)['access']
    headers = {'Authorization': f'Bearer {token}'}
    print("Login successful.")

    # Switch company
    print("\nSwitching to test-main...")
    status, body = make_request(f"{BASE_URL}/organization/companies/test-main/switch/", 'POST', headers=headers)
    print(f"Status: {status}")

    # Test Create Project
    print("\nCreating a test project...")
    project_data = {
        'name': 'Website Redesign',
        'description': 'Complete redesign of corporate website',
        'status': 'planning',
        'start_date': '2025-01-15',
        'deadline': '2025-03-15',
        'budget': '75000',
        'is_billable': True
    }
    status, body = make_request(f"{BASE_URL}/projects/list/", 'POST', project_data, headers)
    print(f"Status: {status}")
    print(body)

    # Test Summary
    print("\nFetching project summary...")
    status, body = make_request(f"{BASE_URL}/projects/list/summary/", 'GET', headers=headers)
    print(f"Status: {status}")
    print(body)

    # Test List
    print("\nFetching projects list...")
    status, body = make_request(f"{BASE_URL}/projects/list/", 'GET', headers=headers)
    print(f"Status: {status}")
    print(body[:500] if len(body) > 500 else body)

if __name__ == "__main__":
    test_projects()
