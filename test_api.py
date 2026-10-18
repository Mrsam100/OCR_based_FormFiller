import urllib.request
import urllib.parse
import json

BASE_URL = "http://127.0.0.1:8000"

def run_tests():
    print("[*] Starting End-to-End API Test Suite...")

    # 1. Status check
    with urllib.request.urlopen(f"{BASE_URL}/api/status") as res:
        status_data = json.loads(res.read().decode())
        assert status_data["status"] == "online"
        print("[OK] 1. System Status endpoint returned 'online'")

    # 2. Login check
    login_payload = json.dumps({"password": "BankShield@2026"}).encode()
    req = urllib.request.Request(
        f"{BASE_URL}/api/auth/login",
        data=login_payload,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as res:
        login_data = json.loads(res.read().decode())
        assert login_data["success"] is True
        token = login_data["token"]
        print(f"[OK] 2. Authentication successful, token acquired: {token[:12]}...")

    # 3. List samples
    with urllib.request.urlopen(f"{BASE_URL}/api/samples") as res:
        samples_data = json.loads(res.read().decode())
        assert len(samples_data["samples"]) >= 5
        print(f"[OK] 3. Samples endpoint returned {len(samples_data['samples'])} sample passbooks")

    # 4. Load & Scan Sample (SBI)
    req = urllib.request.Request(
        f"{BASE_URL}/api/samples/load/sbi",
        data=b"",
        headers={"Authorization": f"Bearer {token}"}
    )
    with urllib.request.urlopen(req) as res:
        ocr_result = json.loads(res.read().decode())
        assert ocr_result["success"] is True
        data = ocr_result["data"]
        assert "SBIN" in data["ifsc_code"]
        assert data["account_number"] == "31984572019"
        assert "RAHUL SHARMA" in data["account_holder"]
        print(f"[OK] 4. OCR Extraction on SBI passbook succeeded:")
        print(f"      - Bank:   {data['bank_name']}")
        print(f"      - Holder: {data['account_holder']}")
        print(f"      - A/C No: {data['account_number']}")
        print(f"      - IFSC:   {data['ifsc_code']}")
        print(f"      - CIF:    {data['cif_number']}")
        print(f"      - Time:   {ocr_result['processing_time_ms']} ms")

    # 5. Verify Session Profile Vault
    req = urllib.request.Request(
        f"{BASE_URL}/api/profile",
        headers={"Authorization": f"Bearer {token}"}
    )
    with urllib.request.urlopen(req) as res:
        prof_data = json.loads(res.read().decode())
        assert prof_data["profile"]["account_number"] == "31984572019"
        print("[OK] 5. Session profile vault correctly holds active user details")

    # 6. Verify Audit Trail
    req = urllib.request.Request(
        f"{BASE_URL}/api/auth/audit",
        headers={"Authorization": f"Bearer {token}"}
    )
    with urllib.request.urlopen(req) as res:
        audit_data = json.loads(res.read().decode())
        assert len(audit_data["audit_trail"]) > 0
        print(f"[OK] 6. Security audit trail verified ({len(audit_data['audit_trail'])} events logged)")

    # 7. Frontend UI check
    with urllib.request.urlopen(f"{BASE_URL}/") as res:
        html = res.read().decode()
        assert "AutoBankFill" in html
        assert "BankShield@2026" in html
        print("[OK] 7. Frontend index.html served with 200 OK")

    print("\n[SUCCESS] ALL TESTS PASSED!")

if __name__ == "__main__":
    run_tests()
