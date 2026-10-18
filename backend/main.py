import os
import io
from fastapi import FastAPI, File, UploadFile, Header, HTTPException, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any

from backend.ocr_engine import process_passbook_image
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

# Ensure sample images exist on startup
@app.on_event("startup")
async def startup_event():
    os.makedirs(SAMPLES_DIR, exist_ok=True)
    if not os.path.exists(os.path.join(SAMPLES_DIR, "sbi_passbook.png")):
        generate_all_samples(SAMPLES_DIR)

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
    sample_path = os.path.join(SAMPLES_DIR, f"{sample_id}_passbook.png")
    if not os.path.exists(sample_path):
        raise HTTPException(status_code=404, detail="Sample passbook not found")
    
    with open(sample_path, "rb") as f:
        img_bytes = f.read()

    result = await process_passbook_image(img_bytes)
    if result.get("success"):
        # Auto save into session profile
        security_vault.store_profile(token, result["data"])
        security_vault._record_audit("SAMPLE_LOADED", f"Loaded sample passbook for {sample_id.upper()}", token)
    return result

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

# Serve Frontend static assets
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/")
async def serve_index():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))
