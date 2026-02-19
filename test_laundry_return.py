import urllib.request
import json
from datetime import datetime
import time

BASE_URL = "http://localhost:8000/api"

def make_request(url, method="GET", data=None):
    req = urllib.request.Request(url, method=method)
    req.add_header('Content-Type', 'application/json')
    
    if data:
        body = json.dumps(data).encode('utf-8')
        req.data = body

    try:
        with urllib.request.urlopen(req) as response:
            return response.status, json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code}")
        print(f"Error Body: {e.read().decode('utf-8')}")
        return e.code, None
    except Exception as e:
        print(f"Error: {e}")
        return 500, None

def test_laundry_workflow():
    dni = f"TEST{int(time.time())}"
    print(f"Testing with DNI: {dni}")

    # 1. Create user
    print("\n1. Creating user...")
    status, res = make_request(f"{BASE_URL}/users", "POST", {
        "name": "Test",
        "surname": "User",
        "dni": dni,
        "contract_type": "Regular Otro sindicato"
    })
    if status != 200: return

    # 2. Send Laundry
    print("\n2. Sending Laundry...")
    payload_send = {
        "dni": dni,
        "items": [{"name": "Polo", "qty": 2}, {"name": "Pantalon", "qty": 1}],
    }
    status, res = make_request(f"{BASE_URL}/laundry", "POST", payload_send)
    if status != 200: return

    # 3. Check Status (Expect 2 Polos, 1 Pantalon pending)
    print("\n3. Checking Status (Expect pending)...")
    status, res = make_request(f"{BASE_URL}/laundry/{dni}/status", "GET")
    print(json.dumps(res, indent=2))

    # 4. Return Laundry (Partial)
    print("\n4. Returning Laundry (1 Polo)...")
    payload_return = {
        "dni": dni,
        "items": [{"name": "Polo", "qty": 1}],
    }
    status, res = make_request(f"{BASE_URL}/laundry/return", "POST", payload_return)
    if status != 200: return

    # 5. Check Status (Expect 1 Polo, 1 Pantalon pending)
    print("\n5. Checking Status (Expect 1 Polo pending)...")
    status, res = make_request(f"{BASE_URL}/laundry/{dni}/status", "GET")
    print(json.dumps(res, indent=2))

if __name__ == "__main__":
    test_laundry_workflow()
