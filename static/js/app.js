/**
 * Main Application Controller
 */
const App = {
  currentProfile: null,
  activeStep: 1,

  init() {
    this.bindEvents();
    Security.init();
    OCRClient.init();
    if (window.BiometricScanner) BiometricScanner.init();
    if (window.Counter2) Counter2.init();
    this.initTheme();

    // Check if we have cached profile in storage
    const cached = localStorage.getItem("bank_vault_cached_profile");
    if (cached) {
      try {
        this.currentProfile = JSON.parse(cached);
        this.renderProfile();
      } catch (e) {}
    }

    // Default form render
    FormsManager.selectForm("account_opening", this.currentProfile);
  },

  onAuthenticated() {
    // If backend has stored profile, retrieve it
    this.fetchStoredProfile();
    Security.loadAuditTrail();
  },

  async fetchStoredProfile() {
    try {
      const res = await fetch("/api/profile", {
        headers: Security.getAuthHeader()
      });
      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          this.setProfile(data.profile);
          this.renderProfile();
        }
      }
    } catch (e) {}
  },

  setProfile(profile) {
    this.currentProfile = profile;
    localStorage.setItem("bank_vault_cached_profile", JSON.stringify(profile));
    this.renderProfile();
    FormsManager.selectForm(FormsManager.currentFormId, this.currentProfile);
  },

  bindEvents() {
    // Step navigation tabs
    document.querySelectorAll(".step-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        const step = parseInt(tab.dataset.step);
        this.goToStep(step);
      });
    });

    // Form selector pills
    document.querySelectorAll(".form-pill").forEach(pill => {
      pill.addEventListener("click", () => {
        const formId = pill.dataset.formId;
        FormsManager.selectForm(formId, this.currentProfile);
      });
    });

    // Autofill Now button
    const autoFillBtn = document.getElementById("triggerAutoFillBtn");
    if (autoFillBtn) {
      autoFillBtn.addEventListener("click", () => {
        if (!this.currentProfile || !this.currentProfile.account_number) {
          alert("Please upload and scan a passbook first or select a sample passbook.");
          this.goToStep(1);
          return;
        }
        FormsManager.animateAutoFill(this.currentProfile);
        this.notifySuccess("All form fields instantly auto-filled with verified passbook data!");
      });
    }

    // Biometric Thumbprint button
    const triggerThumbBtn = document.getElementById("triggerThumbprintBtn");
    if (triggerThumbBtn) {
      triggerThumbBtn.addEventListener("click", () => {
        if (window.BiometricScanner) BiometricScanner.openScanner();
      });
    }

    // Forward to Counter 2 button
    const forwardBtn = document.getElementById("forwardCounter2Btn");
    if (forwardBtn) {
      forwardBtn.addEventListener("click", () => {
        FormsManager.forwardToCounter2();
      });
    }

    // Print Form button
    const printBtn = document.getElementById("printFormBtn");
    if (printBtn) {
      printBtn.addEventListener("click", () => {
        FormsManager.printActiveForm();
      });
    }

    // Copy Profile Data button
    const copyBtn = document.getElementById("copyProfileTextBtn");
    if (copyBtn) {
      copyBtn.addEventListener("click", () => this.copyProfileToClipboard());
    }

    // Export JSON button
    const exportBtn = document.getElementById("exportProfileJsonBtn");
    if (exportBtn) {
      exportBtn.addEventListener("click", () => this.exportProfileJson());
    }

    // Masking toggle button
    const maskBtn = document.getElementById("toggleMaskBtn");
    if (maskBtn) {
      maskBtn.addEventListener("click", () => {
        Security.toggleMasking();
        maskBtn.textContent = Security.isMasked ? "👁️ Reveal Numbers" : "🔒 Mask Numbers";
      });
    }

    // Theme toggle
    const themeBtn = document.getElementById("themeToggleBtn");
    if (themeBtn) {
      themeBtn.addEventListener("click", () => this.toggleTheme());
    }

    // Audit trail refresh button
    const refreshAuditBtn = document.getElementById("refreshAuditBtn");
    if (refreshAuditBtn) {
      refreshAuditBtn.addEventListener("click", () => Security.loadAuditTrail());
    }

    // Proceed to Forms button in Step 1
    const proceedBtn = document.getElementById("proceedToFormsBtn");
    if (proceedBtn) {
      proceedBtn.addEventListener("click", () => {
        this.goToStep(3);
        FormsManager.selectForm("account_opening", this.currentProfile);
      });
    }

    // Save manual edits to profile
    const saveProfileBtn = document.getElementById("saveProfileEditsBtn");
    if (saveProfileBtn) {
      saveProfileBtn.addEventListener("click", () => this.saveManualProfileEdits());
    }

    // Copy Bookmarklet snippet
    const copyBookmarkletBtn = document.getElementById("copyBookmarkletBtn");
    if (copyBookmarkletBtn) {
      copyBookmarkletBtn.addEventListener("click", () => this.copyBookmarkletSnippet());
    }
  },

  goToStep(stepNumber) {
    this.activeStep = stepNumber;
    document.querySelectorAll(".step-tab").forEach(tab => {
      tab.classList.toggle("active", parseInt(tab.dataset.step) === stepNumber);
    });

    document.querySelectorAll(".step-pane").forEach(pane => {
      pane.classList.toggle("active", parseInt(pane.dataset.step) === stepNumber);
    });

    if (stepNumber === 3) {
      FormsManager.selectForm(FormsManager.currentFormId, this.currentProfile);
    }
    if (stepNumber === 4 && window.Counter2) {
      Counter2.loadApplications();
    }
  },

  renderProfile() {
    const p = this.currentProfile || {};
    const getVal = (k, mask = false) => {
      const v = p[k] || "";
      return mask ? Security.maskValue(v, 4) : v;
    };

    // Update verified fields inputs
    this.setInputValue("prof_bank_name", p.bank_name || "");
    this.setInputValue("prof_account_holder", p.account_holder || "");
    this.setInputValue("prof_account_number", getVal("account_number", true));
    this.setInputValue("prof_ifsc_code", p.ifsc_code || "");
    this.setInputValue("prof_cif_number", getVal("cif_number", true));
    this.setInputValue("prof_micr_code", p.micr_code || "");
    this.setInputValue("prof_branch_name", p.branch_name || "");
    this.setInputValue("prof_branch_code", p.branch_code || "");
    this.setInputValue("prof_account_type", p.account_type || "SAVINGS");
    this.setInputValue("prof_mobile", getVal("mobile", true));
    this.setInputValue("prof_email", p.email || "");
    this.setInputValue("prof_issue_date", p.issue_date || "");
    this.setInputValue("prof_address", p.address || "");

    // Update header quick summary if present
    const summaryBank = document.getElementById("summaryBankName");
    if (summaryBank) {
      summaryBank.textContent = p.bank_name ? `${p.bank_name} (${p.account_holder || 'Active'})` : "No Passbook Loaded";
    }

    // Enable/disable proceed button
    const proceedBtn = document.getElementById("proceedToFormsBtn");
    if (proceedBtn) {
      proceedBtn.disabled = !p.account_number;
    }
  },

  setInputValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
  },

  saveManualProfileEdits() {
    if (!this.currentProfile) this.currentProfile = {};
    
    // If not masked, read inputs
    if (!Security.isMasked) {
      this.currentProfile.bank_name = document.getElementById("prof_bank_name").value;
      this.currentProfile.account_holder = document.getElementById("prof_account_holder").value;
      this.currentProfile.account_number = document.getElementById("prof_account_number").value;
      this.currentProfile.ifsc_code = document.getElementById("prof_ifsc_code").value;
      this.currentProfile.cif_number = document.getElementById("prof_cif_number").value;
      this.currentProfile.micr_code = document.getElementById("prof_micr_code").value;
      this.currentProfile.branch_name = document.getElementById("prof_branch_name").value;
      this.currentProfile.branch_code = document.getElementById("prof_branch_code").value;
      this.currentProfile.account_type = document.getElementById("prof_account_type").value;
      this.currentProfile.mobile = document.getElementById("prof_mobile").value;
      this.currentProfile.email = document.getElementById("prof_email").value;
      this.currentProfile.issue_date = document.getElementById("prof_issue_date").value;
      this.currentProfile.address = document.getElementById("prof_address").value;
    }

    this.setProfile(this.currentProfile);
    this.notifySuccess("Profile updates saved to Vault.");
  },

  renderRawOcrLines(lines) {
    const box = document.getElementById("rawOcrTranscriptBox");
    if (box) {
      box.textContent = lines.join("\n");
    }
  },

  clearAllForms() {
    const inputs = document.querySelectorAll(".paper-input");
    inputs.forEach(i => i.value = "");
  },

  copyProfileToClipboard() {
    if (!this.currentProfile) {
      alert("No profile loaded to copy.");
      return;
    }
    const p = this.currentProfile;
    const text = `
BANK DETAILS:
Bank Name: ${p.bank_name || ''}
Account Holder: ${p.account_holder || ''}
Account Number: ${p.account_number || ''}
IFSC Code: ${p.ifsc_code || ''}
CIF / Customer ID: ${p.cif_number || ''}
MICR Code: ${p.micr_code || ''}
Branch: ${p.branch_name || ''} (Code: ${p.branch_code || ''})
Account Type: ${p.account_type || ''}
Mobile: ${p.mobile || ''}
Email: ${p.email || ''}
Address: ${p.address || ''}
Issue Date: ${p.issue_date || ''}
    `.trim();

    navigator.clipboard.writeText(text).then(() => {
      this.notifySuccess("Bank details copied to clipboard!");
    });
  },

  exportProfileJson() {
    if (!this.currentProfile) {
      alert("No profile data available to export.");
      return;
    }
    const blob = new Blob([JSON.stringify(this.currentProfile, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bank_profile_${(this.currentProfile.account_holder || 'account').toLowerCase().replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  copyBookmarkletSnippet() {
    if (!this.currentProfile) {
      alert("Please load a passbook profile first.");
      return;
    }
    const p = this.currentProfile;
    const snippet = `javascript:(function(){
      const data = ${JSON.stringify(p)};
      const map = {
        'account': data.account_number,
        'acc': data.account_number,
        'ifsc': data.ifsc_code,
        'cif': data.cif_number,
        'holder': data.account_holder,
        'name': data.account_holder,
        'branch': data.branch_name,
        'bank': data.bank_name,
        'micr': data.micr_code,
        'mobile': data.mobile,
        'email': data.email,
        'address': data.address
      };
      document.querySelectorAll('input, textarea, select').forEach(el => {
        const id = (el.id + ' ' + el.name + ' ' + (el.placeholder||'')).toLowerCase();
        for (let k in map) {
          if (map[k] && id.includes(k)) {
            el.value = map[k];
            el.dispatchEvent(new Event('input', {bubbles:true}));
            el.style.backgroundColor = '#ecfdf5';
            break;
          }
        }
      });
      alert('AutoBankFill: Form fields filled from saved passbook profile!');
    })();`;

    navigator.clipboard.writeText(snippet).then(() => {
      this.notifySuccess("Autofill bookmarklet copied! You can paste it into browser console or save as bookmark.");
    });
  },

  notifySuccess(msg) {
    const toast = document.createElement("div");
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #059669;
      color: #fff;
      padding: 12px 20px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.9rem;
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.2);
      z-index: 9999;
      display: flex;
      align-items: center;
      gap: 8px;
      animation: fadeIn 0.2s ease-out;
    `;
    toast.innerHTML = `<span>✓</span> <span>${msg}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3500);
  },

  initTheme() {
    const saved = localStorage.getItem("bank_theme") || "light";
    document.documentElement.setAttribute("data-theme", saved);
  },

  toggleTheme() {
    const cur = document.documentElement.getAttribute("data-theme") || "light";
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("bank_theme", next);
  }
};

window.App = App;
window.addEventListener("DOMContentLoaded", () => App.init());
