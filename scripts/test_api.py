import requests
import json

BASE_URL = 'http://127.0.0.1:8000/api/'

def test_api():
    report = []
    
    # 1. Login
    print("Testing Authentication...")
    login_data = {"username": "admin_user", "password": "password123"}
    try:
        r = requests.post(f"{BASE_URL}token/", json=login_data)
        if r.status_code == 200:
            tokens = r.json()
            access_token = tokens['access']
            refresh_token = tokens['refresh']
            report.append({"feature": "Auth: Login", "status": "PASS", "detail": "JWT tokens received"})
            headers = {"Authorization": f"Bearer {access_token}"}
        else:
            report.append({"feature": "Auth: Login", "status": "FAIL", "detail": f"Status {r.status_code}: {r.text}"})
            return report
    except Exception as e:
        report.append({"feature": "Auth: Login", "status": "FAIL", "detail": str(e)})
        return report

    # 2. Token Refresh
    print("Testing Token Refresh...")
    try:
        r = requests.post(f"{BASE_URL}token/refresh/", json={"refresh": refresh_token})
        if r.status_code == 200:
            report.append({"feature": "Auth: Refresh", "status": "PASS", "detail": "New access token received"})
        else:
            report.append({"feature": "Auth: Refresh", "status": "FAIL", "detail": f"Status {r.status_code}: {r.text}"})
    except Exception as e:
        report.append({"feature": "Auth: Refresh", "status": "FAIL", "detail": str(e)})

    # 3. Core Endpoints
    endpoints = [
        ("Employees", "employees/"),
        ("Dashboard Stats", "dashboard/"),
        ("Attendance", "attendance/"),
        ("Payroll", "payroll/"),
        ("Loans", "loans/"),
        ("Leaves", "leaves/"),
        ("Performance", "performance/"),
        ("Applicants", "applicants/"),
    ]

    for name, path in endpoints:
        print(f"Testing {name}...")
        try:
            r = requests.get(f"{BASE_URL}{path}", headers=headers)
            if r.status_code == 200:
                report.append({"feature": f"Endpoint: {name}", "status": "PASS", "detail": "Data retrieved successfully"})
            else:
                report.append({"feature": f"Endpoint: {name}", "status": "FAIL", "detail": f"Status {r.status_code}: {r.text[:100]}"})
        except Exception as e:
            report.append({"feature": f"Endpoint: {name}", "status": "FAIL", "detail": str(e)})

    # 4. Check Frontend/Backend sync (mock)
    # Checking if VITE_API_URL is set in frontend .env
    report.append({"feature": "Frontend Sync", "status": "PENDING", "detail": "Manual check of .env required"})

    return report

if __name__ == "__main__":
    results = test_api()
    print("\nAPI INTEGRATION AUDIT REPORT")
    print("="*40)
    for res in results:
        status_icon = "✓" if res['status'] == "PASS" else "✗" if res['status'] == "FAIL" else "?"
        print(f"[{status_icon}] {res['feature']}: {res['status']}")
        print(f"    Detail: {res['detail']}")
        print("-" * 40)
