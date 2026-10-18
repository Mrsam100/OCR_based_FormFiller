import hashlib
import secrets
import time
from typing import Dict, Any, Optional

DEFAULT_GENERIC_PASSWORD = "BankShield@2026"

class SecurityManager:
    def __init__(self, default_password: str = DEFAULT_GENERIC_PASSWORD):
        self.salt = secrets.token_hex(16)
        self.password_hash = self._hash_password(default_password, self.salt)
        self.active_sessions: Dict[str, Dict[str, Any]] = {}
        self.audit_log: list = []
        self._record_audit("SYSTEM_INITIALIZED", "Security Vault initialized with default master credentials.")

    def _hash_password(self, password: str, salt: str) -> str:
        return hashlib.sha256(f"{password}:{salt}".encode("utf-8")).hexdigest()

    def _record_audit(self, action: str, details: str, session_id: Optional[str] = None):
        self.audit_log.append({
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "action": action,
            "details": details,
            "session_id": session_id[:8] if session_id else "SYSTEM"
        })
        if len(self.audit_log) > 100:
            self.audit_log.pop(0)

    def verify_password(self, password_attempt: str) -> bool:
        attempt_hash = self._hash_password(password_attempt, self.salt)
        return secrets.compare_digest(attempt_hash, self.password_hash)

    def authenticate(self, password_attempt: str) -> Optional[Dict[str, Any]]:
        if self.verify_password(password_attempt):
            token = secrets.token_hex(32)
            session = {
                "token": token,
                "authenticated_at": time.time(),
                "expires_at": time.time() + (3600 * 2),  # 2 hours
                "stored_profile": None
            }
            self.active_sessions[token] = session
            self._record_audit("AUTHENTICATION_SUCCESS", "User authenticated successfully.", token)
            return {
                "token": token,
                "expires_in_seconds": 7200
            }
        else:
            self._record_audit("AUTHENTICATION_FAILED", "Invalid master password entered.")
            return None

    def validate_session(self, token: str) -> bool:
        if not token or token not in self.active_sessions:
            return False
        session = self.active_sessions[token]
        if time.time() > session["expires_at"]:
            del self.active_sessions[token]
            self._record_audit("SESSION_EXPIRED", "Session timed out.", token)
            return False
        return True

    def store_profile(self, token: str, profile_data: dict) -> bool:
        if not self.validate_session(token):
            return False
        self.active_sessions[token]["stored_profile"] = profile_data
        self._record_audit("PROFILE_STORED", f"Bank profile stored for A/C ending in {profile_data.get('account_number', '')[-4:]}", token)
        return True

    def get_profile(self, token: str) -> Optional[dict]:
        if not self.validate_session(token):
            return None
        return self.active_sessions[token].get("stored_profile")

    def terminate_session(self, token: str) -> bool:
        if token in self.active_sessions:
            del self.active_sessions[token]
            self._record_audit("SESSION_LOCKED", "Session terminated and credentials wiped.", token)
            return True
        return False

    def change_password(self, current_pass: str, new_pass: str) -> bool:
        if not self.verify_password(current_pass):
            return False
        if len(new_pass) < 6:
            return False
        self.salt = secrets.token_hex(16)
        self.password_hash = self._hash_password(new_pass, self.salt)
        # Invalidate existing sessions
        self.active_sessions.clear()
        self._record_audit("PASSWORD_CHANGED", "Master password was updated; all sessions invalidated.")
        return True

    def get_audit_trail(self) -> list:
        return list(reversed(self.audit_log))

security_vault = SecurityManager()
