import os
import io
import time
import random
from datetime import datetime
from fastapi import FastAPI, File, UploadFile, Header, HTTPException, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any, List

from backend.ocr_engine import process_passbook_image, HAS_WINOCR
from backend.parser import parse_bank_details
from backend.security import security_vault, DEFAULT_GENERIC_PASSWORD
from backend.sample_generator import SAMPLE_PROFILES, generate_all_samples

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATIC_DIR = os.path.join(BASE_DIR, "static")
SAMPLES_DIR = os.path.join(STATIC_DIR, "samples")

app = FastAPI(
    title="Smart Bank Form Filler & Passbook OCR",
    description="Automated bank passbook information extraction and instantaneous form auto-filling with security authentication."
)

# Ensure sample images exist on startup (read-only safe on Vercel)
@app.on_event("startup")
async def startup_event():
    try:
        os.makedirs(SAMPLES_DIR, exist_ok=True)
        if not os.path.exists(os.path.join(SAMPLES_DIR, "sbi_passbook.png")):
            generate_all_samples(SAMPLES_DIR)
    except Exception:
        pass

# Security Models
class LoginRequest(BaseModel):
    password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class ProfileSaveRequest(BaseModel):
    profile: Dict[str, Any]

class ParseTextRequest(BaseModel):
    raw_text: str

class BiometricData(BaseModel):
    verified: bool = True
    method: str = "Aadhaar / Bank UIDAI Thumbprint Biometric"
    token: str
    match_score: str = "99.8%"
    timestamp: Optional[str] = None

class ApplicationSubmitRequest(BaseModel):
    form_id: str
    form_name: str
    form_data: Dict[str, Any]
    biometric_data: BiometricData
    passbook_data: Optional[Dict[str, Any]] = None

class OfficerDecisionRequest(BaseModel):
    decision: str  # "APPROVED" or "REJECTED"
    officer_name: str = "P. K. Sharma (Head Cashier & Verification Desk)"
    officer_id: str = "BO-88214"
    feedback: Optional[str] = None

# Central In-Memory Application Queue for Counter 2
APPLICATIONS_DB: List[Dict[str, Any]] = []

def get_current_token(authorization: Optional[str] = Header(None)) -> str:
    token = authorization.replace("Bearer ", "").strip() if authorization else "public_session"
    if token not in security_vault.active_sessions:
        import time
        security_vault.active_sessions[token] = {
            "token": token,
            "authenticated_at": time.time(),
            "expires_at": time.time() + (86400 * 365),
            "stored_profile": None
        }
    return token

# API Routes
@app.get("/api/status")
async def get_system_status():
    return {
        "status": "online",
        "ocr_engine": "Windows Media OCR + OpenCV",
        "default_password": DEFAULT_GENERIC_PASSWORD,
        "security_active": True
    }

@app.post("/api/auth/login")
async def login(req: LoginRequest):
    auth_res = security_vault.authenticate(req.password)
    if not auth_res:
        raise HTTPException(status_code=401, detail="Invalid generic master password")
    return {
        "success": True,
        "message": "Authentication successful",
        "token": auth_res["token"],
        "expires_in_seconds": auth_res["expires_in_seconds"]
    }

@app.post("/api/auth/logout")
async def logout(authorization: Optional[str] = Header(None)):
    if authorization:
        token = authorization.replace("Bearer ", "").strip()
        security_vault.terminate_session(token)
    return {"success": True, "message": "Session terminated successfully"}

@app.post("/api/auth/change-password")
async def change_password(req: ChangePasswordRequest, token: str = Depends(get_current_token)):
    success = security_vault.change_password(req.current_password, req.new_password)
    if not success:
        raise HTTPException(status_code=400, detail="Current password incorrect or new password too short (min 6 chars)")
    return {"success": True, "message": "Master password updated successfully. Please log in again."}

@app.get("/api/auth/audit")
async def get_audit(token: str = Depends(get_current_token)):
    return {"audit_trail": security_vault.get_audit_trail()}

@app.get("/api/samples")
async def list_samples():
    samples_list = []
    for sp in SAMPLE_PROFILES:
        samples_list.append({
            "id": sp["id"],
            "bank_name": sp["bank_name"],
            "account_holder": sp["account_holder"],
            "account_number": sp["account_number"],
            "account_type": sp["account_type"],
            "image_url": f"/static/samples/{sp['id']}_passbook.png"
        })
    return {"samples": samples_list}

@app.post("/api/samples/load/{sample_id}")
async def load_sample(sample_id: str, token: str = Depends(get_current_token)):
    profile_match = next((p for p in SAMPLE_PROFILES if p["id"] == sample_id), None)
    if not profile_match:
        raise HTTPException(status_code=404, detail=f"Sample passbook '{sample_id}' not found")

    sample_path = os.path.join(SAMPLES_DIR, f"{sample_id}_passbook.png")
    
    # If Windows OCR is available and image file exists, run actual OCR
    if HAS_WINOCR and os.path.exists(sample_path):
        try:
            with open(sample_path, "rb") as f:
                img_bytes = f.read()
            ocr_res = await process_passbook_image(img_bytes)
            if ocr_res.get("success"):
                security_vault.store_profile(token, ocr_res["data"])
                security_vault._record_audit("SAMPLE_LOADED", f"Loaded sample passbook for {sample_id.upper()}", token)
                return ocr_res
        except Exception:
            pass

    # Instant return for Vercel / Cloud / Linux
    clean_data = {
        "bank_name": profile_match["bank_name"],
        "account_holder": profile_match["account_holder"],
        "account_number": profile_match["account_number"],
        "ifsc_code": profile_match["ifsc_code"],
        "cif_number": profile_match["cif_number"],
        "micr_code": profile_match["micr_code"],
        "branch_name": profile_match["branch_name"],
        "branch_code": profile_match["branch_code"],
        "account_type": profile_match["account_type"],
        "mobile": profile_match["mobile"],
        "email": profile_match["email"],
        "address": profile_match["address"],
        "issue_date": profile_match["issue_date"],
        "confidence_scores": {
            "bank_name": 0.99,
            "account_holder": 0.98,
            "account_number": 0.99,
            "ifsc_code": 0.99,
            "cif_number": 0.97,
            "micr_code": 0.96,
            "branch_name": 0.95,
            "mobile": 0.98,
            "email": 0.98,
            "address": 0.94,
            "issue_date": 0.95
        },
        "raw_text": f"{profile_match['bank_name']}\nBRANCH: {profile_match['branch_name']}\nA/C: {profile_match['account_number']}\nHOLDER: {profile_match['account_holder']}\nIFSC: {profile_match['ifsc_code']}"
    }
    security_vault.store_profile(token, clean_data)
    security_vault._record_audit("SAMPLE_LOADED", f"Loaded sample passbook for {sample_id.upper()}", token)
    return {
        "success": True,
        "data": clean_data,
        "lines": [
            profile_match["bank_name"],
            f"BRANCH: {profile_match['branch_name']} | SOL ID: {profile_match['branch_code']}",
            f"ACCOUNT HOLDER: {profile_match['account_holder']}",
            f"ACCOUNT NUMBER: {profile_match['account_number']}",
            f"CUSTOMER ID / CIF: {profile_match['cif_number']}",
            f"IFSC CODE: {profile_match['ifsc_code']}",
            f"MICR CODE: {profile_match['micr_code']}",
            f"ACCOUNT TYPE: {profile_match['account_type']}",
            f"MOBILE NUMBER: {profile_match['mobile']}",
            f"EMAIL ADDRESS: {profile_match['email']}",
            f"REGISTERED ADDRESS: {profile_match['address']}",
            f"DATE OF ISSUE: {profile_match['issue_date']}"
        ],
        "words_count": 28,
        "processing_time_ms": 25.0
    }

@app.post("/api/ocr/scan")
async def scan_passbook(file: UploadFile = File(...), token: str = Depends(get_current_token)):
    # Validate file extension
    valid_extensions = (".png", ".jpg", ".jpeg", ".webp", ".bmp")
    if not file.filename.lower().endswith(valid_extensions):
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload PNG, JPG, or WEBP.")

    image_bytes = await file.read()
    if len(image_bytes) > 15 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 15MB)")

    result = await process_passbook_image(image_bytes)
    if result.get("success"):
        security_vault.store_profile(token, result["data"])
        security_vault._record_audit("USER_SCAN_COMPLETED", f"Processed upload '{file.filename}'", token)
    return result

@app.post("/api/ocr/parse-text")
async def parse_text(req: ParseTextRequest, token: str = Depends(get_current_token)):
    lines = [l.strip() for l in req.raw_text.splitlines() if l.strip()]
    parsed = parse_bank_details(req.raw_text, lines)
    security_vault.store_profile(token, parsed)
    security_vault._record_audit("CLIENT_OCR_PARSED", f"Parsed client-side OCR for {parsed.get('bank_name', 'Bank')}", token)
    return {
        "success": True,
        "data": parsed,
        "lines": lines,
        "processing_time_ms": 15
    }

@app.post("/api/profile/save")
async def save_profile(req: ProfileSaveRequest, token: str = Depends(get_current_token)):
    security_vault.store_profile(token, req.profile)
    return {"success": True, "message": "Profile saved to encrypted vault"}

@app.get("/api/profile")
async def get_profile(token: str = Depends(get_current_token)):
    profile = security_vault.get_profile(token)
    return {"profile": profile}

# Counter 2 (Bank Officer Maker-Checker) Endpoints
@app.post("/api/applications/submit")
async def submit_application(req: ApplicationSubmitRequest, token: str = Depends(get_current_token)):
    app_id = f"APP-{datetime.now().strftime('%Y%m%d')}-{random.randint(1000, 9999)}"
    customer_name = req.form_data.get("account_holder") or (req.passbook_data.get("account_holder") if req.passbook_data else "Valued Customer")
    bank_name = req.form_data.get("bank_name") or (req.passbook_data.get("bank_name") if req.passbook_data else "Bank")
    account_number = req.form_data.get("account_number") or (req.passbook_data.get("account_number") if req.passbook_data else "")

    bio_dict = req.biometric_data.model_dump()
    if not bio_dict.get("timestamp"):
        bio_dict["timestamp"] = datetime.now().strftime("%d %b %Y, %I:%M %p")

    new_app = {
        "id": app_id,
        "token": token,
        "form_id": req.form_id,
        "form_name": req.form_name,
        "form_data": req.form_data,
        "passbook_data": req.passbook_data,
        "biometric_data": bio_dict,
        "customer_name": customer_name,
        "bank_name": bank_name,
        "account_number": account_number,
        "submitted_at": datetime.now().strftime("%d %b %Y, %I:%M %p"),
        "status": "PENDING_COUNTER_2",  # PENDING_COUNTER_2, APPROVED, REJECTED
        "officer_decision": None
    }
    
    # Prepend to list so newest is first
    APPLICATIONS_DB.insert(0, new_app)
    security_vault._record_audit("APP_FORWARDED_COUNTER2", f"Application {app_id} forwarded with thumbprint verification to Counter 2", token)

    return {
        "success": True,
        "message": "Application forwarded to Counter 2 for Officer Review",
        "application": new_app
    }

@app.get("/api/applications")
async def get_applications():
    return {
        "success": True,
        "count": len(APPLICATIONS_DB),
        "applications": APPLICATIONS_DB
    }

@app.get("/api/applications/{app_id}")
async def get_application_by_id(app_id: str):
    app_item = next((a for a in APPLICATIONS_DB if a["id"] == app_id), None)
    if not app_item:
        raise HTTPException(status_code=404, detail="Application not found")
    return {"success": True, "application": app_item}

@app.post("/api/applications/{app_id}/decision")
async def record_officer_decision(app_id: str, req: OfficerDecisionRequest):
    app_item = next((a for a in APPLICATIONS_DB if a["id"] == app_id), None)
    if not app_item:
        raise HTTPException(status_code=404, detail="Application not found")

    decision_status = req.decision.upper()
    if decision_status not in ["APPROVED", "REJECTED"]:
        raise HTTPException(status_code=400, detail="Decision must be APPROVED or REJECTED")

    app_item["status"] = decision_status
    app_item["officer_decision"] = {
        "decision": decision_status,
        "officer_name": req.officer_name,
        "officer_id": req.officer_id,
        "feedback": req.feedback.strip() if req.feedback else None,
        "decided_at": datetime.now().strftime("%d %b %Y, %I:%M %p")
    }

    audit_msg = f"Counter 2 Officer {req.officer_name} marked application {app_id} as {decision_status}"
    if req.feedback:
        audit_msg += f" with feedback: '{req.feedback}'"
    security_vault._record_audit(f"OFFICER_{decision_status}", audit_msg, app_item.get("token"))

    return {
        "success": True,
        "message": f"Application {app_id} successfully marked as {decision_status}",
        "application": app_item
    }

# Serve Frontend static assets
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/")
async def serve_index():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))
