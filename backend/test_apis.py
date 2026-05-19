import requests
import uuid
import sys

BASE_URL = "http://127.0.0.1:8000"

def test_items():
    print("Testing GET /items...")
    resp = requests.get(f"{BASE_URL}/items")
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    data = resp.json()
    assert isinstance(data, list)
    print(f"  OK (found {len(data)} items)")

def test_auth_and_vote():
    print("Testing POST /auth/register...")
    username = f"testuser_{uuid.uuid4().hex[:6]}"
    password = "password123"
    
    resp = requests.post(f"{BASE_URL}/auth/register", json={"username": username, "password": password})
    if resp.status_code != 201:
        print(f"  Failed: {resp.text}")
        sys.exit(1)
    
    token = resp.json().get("token")
    assert token, "Token missing in response"
    print("  OK (registered)")

    print("Testing POST /auth/login...")
    resp = requests.post(f"{BASE_URL}/auth/login", json={"username": username, "password": password})
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    print("  OK (logged in)")

    print("Testing POST /vote (Authenticated)...")
    headers = {"Authorization": f"Bearer {token}"}
    payload = {"itemId": 1, "choice": "yes", "decisionTimeMs": 1000}
    resp = requests.post(f"{BASE_URL}/vote", json=payload, headers=headers)
    if resp.status_code != 200:
        print(f"  Failed: {resp.text}")
        sys.exit(1)
    print("  OK (voted)")

    print("Testing GET /results/me...")
    resp = requests.get(f"{BASE_URL}/results/me", headers=headers)
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    data = resp.json()
    assert data["total"] >= 1, "Expected at least 1 vote in history"
    print("  OK (fetched my votes)")

def test_anon_vote():
    print("Testing POST /vote (Anonymous)...")
    session_id = f"anon_session_{uuid.uuid4().hex[:6]}"
    payload = {"itemId": 2, "choice": "no", "sessionId": session_id, "decisionTimeMs": 1500}
    resp = requests.post(f"{BASE_URL}/vote", json=payload)
    if resp.status_code != 200:
        print(f"  Failed: {resp.text}")
        sys.exit(1)
    print("  OK (anonymous vote recorded)")

def test_results():
    print("Testing GET /results...")
    resp = requests.get(f"{BASE_URL}/results")
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    data = resp.json()
    assert "total_users" in data
    print(f"  OK (total unique users: {data['total_users']})")

if __name__ == "__main__":
    try:
        test_items()
        test_auth_and_vote()
        test_anon_vote()
        test_results()
        print("ALL TESTS PASSED SUCCESSFULLY!")
    except Exception as e:
        print(f"TEST FAILED: {e}")
        sys.exit(1)
