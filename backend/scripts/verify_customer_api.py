import requests
import json

BASE_URL = "http://localhost:8000/api/v1"
EMAIL = "test@example.com"
PASSWORD = "password123"

def test_customers():
    session = requests.Session()
    
    # Login first
    login_resp = session.post(f"{BASE_URL}/auth/login/", json={"email": EMAIL, "password": PASSWORD})
    if login_resp.status_code != 200:
        print("Login failed")
        return
    token = login_resp.json()['access']
    headers = {'Authorization': f'Bearer {token}'}

    # Create Customer
    print(" Creating customer...")
    data = {
        "company_name": "Test Client Corp",
        "contact_person": "John Doe",
        "email": "john@testclient.com",
        "phone": "5551234567",
        "status": "active"
    }
    resp = session.post(f"{BASE_URL}/customers/list/", json=data, headers=headers)
    if resp.status_code == 201:
        print(" SUCCESS: Customer created")
        cust_id = resp.json()['id']
    else:
        print(f" FAILED: {resp.text}")
        return

    # List Customers
    print(" Listing customers...")
    resp = session.get(f"{BASE_URL}/customers/list/", headers=headers)
    if resp.status_code == 200:
        count = len(resp.json())
        print(f" SUCCESS: Found {count} customers")
    else:
        print(f" FAILED: {resp.text}")

if __name__ == "__main__":
    test_customers()
