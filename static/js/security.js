/**
 * Security and Vault Authentication Manager
 */
const Security = {
  token: sessionStorage.getItem("bank_vault_token") || null,
  autoLockTimer: null,
  inactivityTimeoutMinutes: 5,
  secondsRemaining: 300,
  isMasked: true,

  init() {
    this.bindEvents();
    if (this.token) {
      this.startInactivityTimer();
      this.hideLockScreen();
      this.loadAuditTrail();
    } else {
      this.showLockScreen();
    }
  },

  bindEvents() {
    // Activity tracking for auto-lock reset
    ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(evt => {
      document.addEventListener(evt, () => this.resetInactivityTimer(), { passive: true });
    });

    // Login form submission
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleLogin();
      });
    }

    // Demo password auto-fill button
    const demoBtn = document.getElementById("fillDemoPasswordBtn");
    if (demoBtn) {
      demoBtn.addEventListener("click", () => {
        document.getElementById("masterPasswordInput").value = "BankShield@2026";
      });
    }

    // Lock Vault button
    const lockBtn = document.getElementById("lockVaultBtn");
    if (lockBtn) {
      lockBtn.addEventListener("click", () => this.lockVault());
    }

    // Change Password form
    const changePassForm = document.getElementById("changePasswordForm");
    if (changePassForm) {
      changePassForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleChangePassword();
      });
    }

    // Panic / Wipe data button
    const panicBtn = document.getElementById("panicWipeBtn");
    if (panicBtn) {
      panicBtn.addEventListener("click", () => {
        if (confirm("Are you sure you want to securely wipe all stored banking profiles and session data immediately?")) {
          this.wipeAllData();
        }
      });
    }
  },

  async handleLogin() {
    const input = document.getElementById("masterPasswordInput");
    const errorEl = document.getElementById("loginErrorMsg");
    const submitBtn = document.getElementById("loginSubmitBtn");
    
    errorEl.style.display = "none";
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Verifying...';

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: input.value })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        this.token = data.token;
        sessionStorage.setItem("bank_vault_token", data.token);
        this.hideLockScreen();
        this.startInactivityTimer();
        input.value = "";
        
        // Notify App to refresh profile and samples
        if (window.App) {
          window.App.onAuthenticated();
        }
      } else {
        errorEl.textContent = data.detail || "Invalid master password. Please check your credentials.";
        errorEl.style.display = "block";
      }
    } catch (err) {
      errorEl.textContent = "Failed to connect to security server.";
      errorEl.style.display = "block";
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Unlock Vault & Proceed';
    }
  },

  async lockVault() {
    if (this.token) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { "Authorization": `Bearer ${this.token}` }
        });
      } catch (e) {}
    }
    this.token = null;
    sessionStorage.removeItem("bank_vault_token");
    this.stopInactivityTimer();
    this.showLockScreen();
  },

  wipeAllData() {
    this.lockVault();
    sessionStorage.clear();
    localStorage.removeItem("bank_vault_cached_profile");
    if (window.App) {
      window.App.currentProfile = null;
      window.App.renderProfile();
      window.App.clearAllForms();
    }
    alert("Security Vault wiped. All memory traces cleared.");
  },

  showLockScreen() {
    const overlay = document.getElementById("lockScreenModal");
    if (overlay) overlay.classList.add("active");
  },

  hideLockScreen() {
    const overlay = document.getElementById("lockScreenModal");
    if (overlay) overlay.classList.remove("active");
  },

  startInactivityTimer() {
    this.secondsRemaining = this.inactivityTimeoutMinutes * 60;
    this.updateTimerDisplay();
    clearInterval(this.autoLockTimer);
    this.autoLockTimer = setInterval(() => {
      this.secondsRemaining--;
      this.updateTimerDisplay();
      if (this.secondsRemaining <= 0) {
        clearInterval(this.autoLockTimer);
        this.lockVault();
        alert("Session timed out due to inactivity. Vault automatically locked.");
      }
    }, 1000);
  },

  resetInactivityTimer() {
    if (this.token) {
      this.secondsRemaining = this.inactivityTimeoutMinutes * 60;
    }
  },

  stopInactivityTimer() {
    clearInterval(this.autoLockTimer);
  },

  updateTimerDisplay() {
    const el = document.getElementById("autoLockTimerText");
    if (el) {
      const mins = Math.floor(this.secondsRemaining / 60);
      const secs = this.secondsRemaining % 60;
      el.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
  },

  getAuthHeader() {
    return this.token ? { "Authorization": `Bearer ${this.token}` } : {};
  },

  toggleMasking() {
    this.isMasked = !this.isMasked;
    if (window.App) window.App.renderProfile();
  },

  maskValue(val, showLast = 4) {
    if (!val) return "";
    if (!this.isMasked) return val;
    const str = String(val);
    if (str.length <= showLast) return str;
    const maskedPart = "•".repeat(str.length - showLast);
    return maskedPart + str.slice(-showLast);
  },

  async loadAuditTrail() {
    if (!this.token) return;
    try {
      const res = await fetch("/api/auth/audit", {
        headers: this.getAuthHeader()
      });
      if (res.ok) {
        const data = await res.json();
        this.renderAuditTrail(data.audit_trail || []);
      }
    } catch (e) {}
  },

  renderAuditTrail(logs) {
    const container = document.getElementById("auditTrailList");
    if (!container) return;
    if (logs.length === 0) {
      container.innerHTML = '<div style="color:var(--text-muted);font-size:0.85rem;">No audit events recorded yet.</div>';
      return;
    }
    container.innerHTML = logs.map(l => `
      <div style="border-bottom: 1px solid var(--border); padding: 0.5rem 0; font-size: 0.82rem;">
        <div style="display:flex; justify-content:space-between; color:var(--text-muted);">
          <span style="font-weight:600; color:var(--primary);">${l.action}</span>
          <span>${l.timestamp}</span>
        </div>
        <div style="color:var(--text-main); margin-top:2px;">${l.details}</div>
      </div>
    `).join("");
  },

  async handleChangePassword() {
    const curPass = document.getElementById("currentPassInput").value;
    const newPass = document.getElementById("newPassInput").value;
    const msgEl = document.getElementById("changePassMsg");

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...this.getAuthHeader()
        },
        body: JSON.stringify({ current_password: curPass, new_password: newPass })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        msgEl.innerHTML = `<span style="color:var(--success); font-weight:600;">${data.message}</span>`;
        setTimeout(() => {
          this.lockVault();
          document.getElementById("changePasswordModal").classList.remove("active");
        }, 1500);
      } else {
        msgEl.innerHTML = `<span style="color:var(--danger); font-weight:600;">${data.detail || "Failed to update password."}</span>`;
      }
    } catch (e) {
      msgEl.innerHTML = `<span style="color:var(--danger);">Network error updating password.</span>`;
    }
  }
};
