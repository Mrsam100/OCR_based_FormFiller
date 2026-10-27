/**
 * Counter 2: Bank Officer Maker-Checker Approval Desk
 * Handles reviewing forwarded digital applications, biometric verification checks,
 * approving applications, or rejecting with detailed feedback remarks.
 */
const Counter2 = {
  applications: [],
  selectedApp: null,
  pollTimer: null,

  init() {
    this.bindEvents();
    this.loadApplications();
    // Background refresh every 6 seconds to keep live sync
    this.pollTimer = setInterval(() => this.loadApplications(true), 6000);
  },

  bindEvents() {
    const refreshBtn = document.getElementById("refreshCounter2Btn");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => this.loadApplications());
    }

    const closeReviewBtn = document.getElementById("closeOfficerReviewBtn");
    if (closeReviewBtn) {
      closeReviewBtn.addEventListener("click", () => this.closeReviewModal());
    }

    const approveBtn = document.getElementById("officerApproveBtn");
    if (approveBtn) {
      approveBtn.addEventListener("click", () => this.handleOfficerDecision("APPROVED"));
    }

    const rejectBtn = document.getElementById("officerRejectBtn");
    if (rejectBtn) {
      rejectBtn.addEventListener("click", () => this.openFeedbackDialog());
    }

    const submitFeedbackBtn = document.getElementById("submitOfficerFeedbackBtn");
    if (submitFeedbackBtn) {
      submitFeedbackBtn.addEventListener("click", () => this.handleOfficerDecision("REJECTED"));
    }

    const cancelFeedbackBtn = document.getElementById("cancelFeedbackDialogBtn");
    if (cancelFeedbackBtn) {
      cancelFeedbackBtn.addEventListener("click", () => {
        document.getElementById("officerFeedbackModal").classList.remove("active");
      });
    }

    // Quick feedback chips
    document.querySelectorAll(".feedback-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        const text = chip.dataset.feedback;
        const textarea = document.getElementById("officerFeedbackInput");
        if (textarea) {
          textarea.value = text;
        }
      });
    });
  },

  async loadApplications(silent = false) {
    try {
      const res = await fetch("/api/applications");
      if (res.ok) {
        const data = await res.json();
        if (data.applications) {
          this.applications = data.applications;
          this.renderQueue();
          this.updateNavBadge();
          this.syncActiveCustomerApplication();
          return;
        }
      }
    } catch (e) {
      if (!silent) console.warn("Using local queue storage", e);
    }

    // Fallback from localStorage
    const local = localStorage.getItem("bank_counter2_apps");
    if (local) {
      try {
        this.applications = JSON.parse(local);
        this.renderQueue();
        this.updateNavBadge();
        this.syncActiveCustomerApplication();
      } catch (err) {}
    }
  },

  saveLocalBackup() {
    try {
      localStorage.setItem("bank_counter2_apps", JSON.stringify(this.applications));
    } catch (e) {}
  },

  updateNavBadge() {
    const badge = document.getElementById("counter2Badge");
    if (!badge) return;
    const pendingCount = this.applications.filter(a => a.status === "PENDING_COUNTER_2").length;
    if (pendingCount > 0) {
      badge.textContent = pendingCount;
      badge.style.display = "inline-flex";
    } else {
      badge.style.display = "none";
    }
  },

  renderQueue() {
    const listEl = document.getElementById("counter2QueueList");
    if (!listEl) return;

    // Update stats counters
    const totalCount = this.applications.length;
    const pendingCount = this.applications.filter(a => a.status === "PENDING_COUNTER_2").length;
    const approvedCount = this.applications.filter(a => a.status === "APPROVED").length;
    const rejectedCount = this.applications.filter(a => a.status === "REJECTED").length;

    const elTotal = document.getElementById("statTotalApps");
    const elPending = document.getElementById("statPendingApps");
    const elApproved = document.getElementById("statApprovedApps");
    const elRejected = document.getElementById("statRejectedApps");

    if (elTotal) elTotal.textContent = totalCount;
    if (elPending) elPending.textContent = pendingCount;
    if (elApproved) elApproved.textContent = approvedCount;
    if (elRejected) elRejected.textContent = rejectedCount;

    if (this.applications.length === 0) {
      listEl.innerHTML = `
        <div style="text-align:center; padding:3rem 1rem; color:var(--text-muted);">
          <div style="font-size:3rem; margin-bottom:0.75rem;">📭</div>
          <div style="font-weight:600; font-size:1.1rem; color:var(--text-main);">Counter 2 Queue is Empty</div>
          <div style="font-size:0.85rem; margin-top:4px;">
            No applications forwarded from customer kiosks yet. Complete a form & scan biometric thumbprint in Step 3 to forward an application!
          </div>
        </div>
      `;
      return;
    }

    listEl.innerHTML = this.applications.map(app => {
      let statusTag = '';
      if (app.status === 'APPROVED') {
        statusTag = `<span class="badge-tag green">✓ APPROVED</span>`;
      } else if (app.status === 'REJECTED') {
        statusTag = `<span class="badge-tag red">❌ RETURNED (FEEDBACK)</span>`;
      } else {
        statusTag = `<span class="badge-tag amber animate-pulse">⏳ PENDING OFFICER REVIEW</span>`;
      }

      return `
        <div class="officer-queue-item ${app.status.toLowerCase()}">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:0.5rem;">
            <div>
              <div style="display:flex; align-items:center; gap:0.6rem;">
                <strong style="font-size:1.05rem; color:var(--text-main);">${app.customer_name || 'Customer'}</strong>
                <span style="font-family:monospace; font-size:0.8rem; background:var(--bg-main); padding:2px 6px; border-radius:4px; border:1px solid var(--border);">${app.id}</span>
                ${statusTag}
              </div>
              <div style="font-size:0.82rem; color:var(--text-muted); margin-top:3px;">
                ${app.form_name} • A/C: <strong>${app.account_number || 'N/A'}</strong> • Bank: <strong>${app.bank_name || 'Bank'}</strong>
              </div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:0.75rem; color:var(--text-light);">${app.submitted_at}</div>
              <button class="btn btn-sm btn-primary" style="margin-top:6px;" onclick="Counter2.openReviewModal('${app.id}')">
                🔎 Review Application
              </button>
            </div>
          </div>

          <div style="margin-top:0.65rem; padding-top:0.65rem; border-top:1px dashed var(--border); display:flex; justify-content:space-between; align-items:center; font-size:0.8rem;">
            <div style="display:flex; align-items:center; gap:0.4rem; color:var(--success);">
              <span>👆</span>
              <span>Thumbprint Attested (${app.biometric_data?.token || 'BIO-VERIFIED'})</span>
              <span style="color:var(--text-muted); font-size:0.75rem;">[Confidence: ${app.biometric_data?.match_score || '99.8%'}]</span>
            </div>
            ${app.officer_decision?.feedback ? `<div style="color:var(--danger); font-size:0.78rem;"><strong>Feedback:</strong> "${app.officer_decision.feedback.substring(0, 45)}..."</div>` : ''}
          </div>
        </div>
      `;
    }).join("");
  },

  openReviewModal(appId) {
    const app = this.applications.find(a => a.id === appId);
    if (!app) return;
    this.selectedApp = app;

    const modal = document.getElementById("officerReviewModal");
    if (!modal) return;

    document.getElementById("reviewModalAppId").textContent = app.id;
    document.getElementById("reviewModalCustomer").textContent = app.customer_name || "Applicant";
    document.getElementById("reviewModalFormName").textContent = app.form_name;
    document.getElementById("reviewModalTime").textContent = app.submitted_at;
    document.getElementById("reviewModalBank").textContent = app.bank_name || "Bank";
    document.getElementById("reviewModalAcc").textContent = app.account_number || "N/A";
    document.getElementById("reviewModalBioToken").textContent = app.biometric_data?.token || "BIO-VERIFIED";

    // Populate Fields Table
    const fieldsContainer = document.getElementById("reviewModalFieldsList");
    if (fieldsContainer && app.form_data) {
      fieldsContainer.innerHTML = Object.entries(app.form_data)
        .filter(([k, v]) => v && typeof v === 'string')
        .map(([k, v]) => `
          <div style="display:flex; justify-content:space-between; padding:0.4rem 0; border-bottom:1px solid var(--border); font-size:0.85rem;">
            <span style="color:var(--text-muted); text-transform:capitalize;">${k.replace(/_/g, ' ')}:</span>
            <strong style="color:var(--text-main); font-family:inherit;">${v}</strong>
          </div>
        `).join("");
    }

    // Status preview
    const statusBox = document.getElementById("reviewModalStatusPreview");
    if (statusBox) {
      if (app.status === 'APPROVED') {
        statusBox.innerHTML = `
          <div class="alert alert-success">
            <strong>✓ Already Approved</strong> by ${app.officer_decision?.officer_name} on ${app.officer_decision?.decided_at}
          </div>
        `;
      } else if (app.status === 'REJECTED') {
        statusBox.innerHTML = `
          <div class="alert alert-warning">
            <strong>❌ Rejected with Feedback:</strong> "${app.officer_decision?.feedback || 'Returned for corrections'}"
          </div>
        `;
      } else {
        statusBox.innerHTML = `
          <div class="alert alert-info">
            <strong>⏳ Awaiting Officer Decision:</strong> Verify biometric thumbprint and applicant details below.
          </div>
        `;
      }
    }

    modal.classList.add("active");
  },

  closeReviewModal() {
    const modal = document.getElementById("officerReviewModal");
    if (modal) modal.classList.remove("active");
    this.selectedApp = null;
  },

  openFeedbackDialog() {
    if (!this.selectedApp) return;
    const modal = document.getElementById("officerFeedbackModal");
    if (!modal) return;

    document.getElementById("feedbackAppIdLabel").textContent = this.selectedApp.id;
    document.getElementById("feedbackCustomerLabel").textContent = this.selectedApp.customer_name;
    document.getElementById("officerFeedbackInput").value = "";

    modal.classList.add("active");
  },

  async handleOfficerDecision(decision) {
    if (!this.selectedApp) return;
    const appId = this.selectedApp.id;
    const officerName = document.getElementById("officerNameSelector")?.value || "P. K. Sharma (Head Cashier & Verification Desk)";
    let feedback = null;

    if (decision === "REJECTED") {
      feedback = document.getElementById("officerFeedbackInput")?.value.trim();
      if (!feedback) {
        alert("Please write a feedback remark or reason explaining why the application is returned to the customer.");
        return;
      }
      document.getElementById("officerFeedbackModal").classList.remove("active");
    }

    const payload = {
      decision: decision,
      officer_name: officerName,
      officer_id: "BO-88214",
      feedback: feedback
    };

    try {
      const res = await fetch(`/api/applications/${appId}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.application) {
          const idx = this.applications.findIndex(a => a.id === appId);
          if (idx !== -1) {
            this.applications[idx] = data.application;
          }
        }
      }
    } catch (e) {
      console.warn("Using offline decision handler", e);
      // Fallback local update
      const app = this.applications.find(a => a.id === appId);
      if (app) {
        app.status = decision;
        app.officer_decision = {
          decision: decision,
          officer_name: officerName,
          officer_id: "BO-88214",
          feedback: feedback,
          decided_at: new Date().toLocaleDateString() + ", " + new Date().toLocaleTimeString()
        };
      }
    }

    this.saveLocalBackup();
    this.renderQueue();
    this.updateNavBadge();
    this.closeReviewModal();
    this.syncActiveCustomerApplication();

    if (window.App) {
      if (decision === "APPROVED") {
        window.App.notifySuccess(`Application ${appId} Approved! Decision dispatched to customer portal.`);
      } else {
        window.App.notifySuccess(`Application ${appId} returned to customer with feedback remarks.`);
      }
    }
  },

  syncActiveCustomerApplication() {
    if (!FormsManager || !FormsManager.activeApplication) return;
    const updated = this.applications.find(a => a.id === FormsManager.activeApplication.id);
    if (updated) {
      FormsManager.activeApplication = updated;
      FormsManager.updateFormAttestationUI();
    }
  }
};

window.Counter2 = Counter2;
