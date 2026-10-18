/**
 * Security and Vault Manager (Password Protection Removed - Open Access)
 */
const Security = {
  token: "public_session",
  isMasked: false,

  init() {
    this.bindEvents();
    this.hideLockScreen();
    if (window.App) {
      window.App.onAuthenticated();
    }
  },

  bindEvents() {
    // Panic / Wipe data button
    const panicBtn = document.getElementById("panicWipeBtn");
    if (panicBtn) {
      panicBtn.addEventListener("click", () => {
        if (confirm("Are you sure you want to clear all loaded banking profiles and start fresh?")) {
          this.wipeAllData();
        }
      });
    }
  },

  wipeAllData() {
    sessionStorage.clear();
    localStorage.removeItem("bank_vault_cached_profile");
    if (window.App) {
      window.App.currentProfile = null;
      window.App.renderProfile();
      window.App.clearAllForms();
    }
    alert("Banking profile cleared.");
  },

  showLockScreen() {
    const overlay = document.getElementById("lockScreenModal");
    if (overlay) overlay.style.display = "none";
  },

  hideLockScreen() {
    const overlay = document.getElementById("lockScreenModal");
    if (overlay) overlay.style.display = "none";
  },

  getAuthHeader() {
    return { "Authorization": `Bearer ${this.token}` };
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
      container.innerHTML = '<div style="color:var(--text-muted);font-size:0.85rem;">No activity events recorded yet.</div>';
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
  }
};
