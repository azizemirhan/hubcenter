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

def test_tasks():
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

    # Test Create Task
    print("\nCreating a test task...")
    task_data = {
        'title': 'Homepage Design',
        'description': 'Design the new homepage layout',
        'priority': 'high',
        'status': 'todo',
        'due_date': '2025-01-20'
    }
    status, body = make_request(f"{BASE_URL}/tasks/list/", 'POST', task_data, headers)
    print(f"Status: {status}")
    print(body)

    # Test Kanban
    print("\nFetching Kanban data...")
    status, body = make_request(f"{BASE_URL}/tasks/list/kanban/", 'GET', headers=headers)
    print(f"Status: {status}")
    print(body[:500] if len(body) > 500 else body)

    # Test My Tasks
    print("\nFetching my tasks...")
    status, body = make_request(f"{BASE_URL}/tasks/list/my_tasks/", 'GET', headers=headers)
    print(f"Status: {status}")
    print(body[:300] if len(body) > 300 else body)

if __name__ == "__main__":
    test_tasks()
