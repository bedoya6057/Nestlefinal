import requests
from database import SessionLocal
from models import Laundry, LaundryReturn
import json

def check_db():
    db = SessionLocal()
    print("--- Database Content ---")
    laundries = db.query(Laundry).all()
    print(f"Laundry Records: {len(laundries)}")
    for l in laundries:
        print(f"  ID: {l.id}, Guide: {l.guide_number}, Status: {l.status}, Date: {l.date}")

    returns = db.query(LaundryReturn).all()
    print(f"Return Records: {len(returns)}")
    for r in returns:
        print(f"  ID: {r.id}, Guide: {r.guide_number}, Status: {r.status}")
    db.close()

def check_api():
    print("\n--- API Responses ---")
    try:
        # Stats
        print("Testing POST /api/stats (Wait, GET)")
        r_stats = requests.get("http://localhost:8000/api/stats")
        print(f"GET /api/stats Status: {r_stats.status_code}")
        print(f"Response: {json.dumps(r_stats.json(), indent=2)}")

        # Dashboard Data
        r_laundry = requests.get("http://localhost:8000/api/laundry")
        print(f"GET /api/laundry Status: {r_laundry.status_code}")
        # print(f"Response: {json.dumps(r_laundry.json(), indent=2)}") # Too long

        # Report Data (All)
        r_report = requests.get("http://localhost:8000/api/laundry/report")
        print(f"GET /api/laundry/report (All) Status: {r_report.status_code}")
        print(f"Count: {len(r_report.json())}")

        # Report Data (Search '1234')
        r_search = requests.get("http://localhost:8000/api/laundry/report?guide=1234")
        print(f"GET /api/laundry/report?guide=1234 Status: {r_search.status_code}")
        print(f"Response: {json.dumps(r_search.json(), indent=2)}")
        
    except Exception as e:
        print(f"API Error: {e}")

if __name__ == "__main__":
    check_db()
    check_api()
