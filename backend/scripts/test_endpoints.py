import urllib.request
import urllib.parse
import json
import ssl

# Ignore SSL warnings if any (development)
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

def test_endpoints():
    print(f"Logging in as {EMAIL}...")
    status, body = make_request(f"{BASE_URL}/auth/login/", 'POST', {'email': EMAIL, 'password': PASSWORD})
    if status != 200:
        print(f"Login failed: {status}")
        print(body)
        return
    
    token = json.loads(body)['access']
    headers = {'Authorization': f'Bearer {token}'}
    print("Login successful.")

    # Test Retrieve - Switch to test-sub to see if it fails
    target_slug = "test-sub"
    print(f"\nTesting GET /organization/companies/{target_slug}/ ...")
    status, body = make_request(f"{BASE_URL}/organization/companies/{target_slug}/", 'GET', headers=headers)
    print(f"Status: {status}")
    if status != 200:
        print(body)

    # Test Switch
    print(f"\nTesting POST /organization/companies/{target_slug}/switch/ ...")
    status, body = make_request(f"{BASE_URL}/organization/companies/{target_slug}/switch/", 'POST', headers=headers)
    print(f"Status: {status}")
    print(body)

    # Test Mine
    print("\nTesting GET /organization/companies/mine/ ...")
    status, body = make_request(f"{BASE_URL}/organization/companies/mine/", 'GET', headers=headers)
    print(f"Status: {status}")
    print(body)

if __name__ == "__main__":
    test_endpoints()
