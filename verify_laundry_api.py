import requests
import json

payload = {
    "guide_number": "TEST-GUIDE-12345",
    "weight": 0,
    "items": [
        {"name": "Chaqueta", "qty": 1},
        {"name": "Pantalon", "qty": 1},
        {"name": "Polo", "qty": 1}
    ]
}

try:
    response = requests.post("http://localhost:8000/api/laundry", json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
