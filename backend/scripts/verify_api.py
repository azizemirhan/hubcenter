import requests
import json

BASE_URL = "http://localhost:8000/api/v1"
EMAIL = "test@example.com"
PASSWORD = "password123"

def test_api():
    session = requests.Session()

    print(f"1. Testing Login ({EMAIL})...")
    login_resp = session.post(f"{BASE_URL}/auth/login/", json={
        "email": EMAIL,
        "password": PASSWORD
    })
    
    if login_resp.status_code != 200:
        print(f"FAILED: Login failed: {login_resp.text}")
        return
    
    data = login_resp.json()
    access_token = data.get('access')
    print("SUCCESS: Login successful. Got access token.")
    
    headers = {'Authorization': f'Bearer {access_token}'}

    print("\n2. Testing /auth/me/...")
    me_resp = session.get(f"{BASE_URL}/auth/me/", headers=headers)
    if me_resp.status_code == 200:
        me_data = me_resp.json()
        print(f"SUCCESS: User: {me_data['first_name']} {me_data['last_name']}")
    else:
        print(f"FAILED: {me_resp.text}")

    print("\n3. Testing /organization/companies/mine/...")
    comp_resp = session.get(f"{BASE_URL}/organization/companies/mine/", headers=headers)
    if comp_resp.status_code == 200:
        companies = comp_resp.json()
        print(f"SUCCESS: Found {len(companies)} companies.")
        for comp in companies:
            print(f" - {comp['name']} ({comp['company_type']})")
    else:
        print(f"FAILED: {comp_resp.text}")

if __name__ == "__main__":
    test_api()
