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

def test_finance():
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

    # Test Invoice
    print("\nCreating invoice...")
    inv_data = {
        'customer': customer_id,
        'invoice_no': 'INV-2025-001',
        'amount': '5000',
        'tax_rate': '20',
        'issue_date': '2025-01-01',
        'due_date': '2025-01-31'
    }
    status, body = make_request(f"{BASE_URL}/finance/invoices/", 'POST', inv_data, headers)
    print(f"Invoice Status: {status}")
    print(body[:300] if len(body) > 300 else body)

    # Test Invoice Summary
    print("\nFetching invoice summary...")
    status, body = make_request(f"{BASE_URL}/finance/invoices/summary/", 'GET', headers=headers)
    print(f"Summary Status: {status}")
    print(body)

    # Test Income
    print("\nCreating income...")
    inc_data = {
        'customer': customer_id,
        'amount': '2500',
        'payment_method': 'bank_transfer',
        'received_date': '2025-01-05'
    }
    status, body = make_request(f"{BASE_URL}/finance/incomes/", 'POST', inc_data, headers)
    print(f"Income Status: {status}")

    # Test Expense
    print("\nCreating expense...")
    exp_data = {
        'category': 'software',
        'title': 'GitHub Pro',
        'amount': '100',
        'period_type': 'monthly',
        'start_date': '2025-01-01'
    }
    status, body = make_request(f"{BASE_URL}/finance/expenses/", 'POST', exp_data, headers)
    print(f"Expense Status: {status}")

    # Test Expense Summary
    print("\nFetching expense summary...")
    status, body = make_request(f"{BASE_URL}/finance/expenses/summary/", 'GET', headers=headers)
    print(f"Expense Summary Status: {status}")
    print(body)

if __name__ == "__main__":
    test_finance()
