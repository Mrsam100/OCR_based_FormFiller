/**
 * Bank Forms Definition, Field Mapping & Paperless Biometric Workflow Engine
 * Eliminates physical paper printing and signatures by routing verified forms to Counter 2.
 */
const FormsManager = {
  currentFormId: "account_opening",
  currentBiometric: null,
  activeApplication: null,

  renderDigitalAttestationBlock(p) {
    const profile = p || {};
    const bio = this.currentBiometric;
    const app = this.activeApplication;

    let bioHtml = '';
    if (bio && bio.verified) {
      bioHtml = `
        <div class="biometric-seal-card verified">
          <div class="bio-seal-icon">
            <svg viewBox="0 0 24 24" width="34" height="34" fill="#059669">
              <path d="M17.81 4.47c-.08 0-.16-.02-.23-.06C15.66 3.42 14 3 12.01 3c-1.98 0-3.86.47-5.57 1.41-.24.13-.54.04-.68-.2-.13-.24-.04-.55.2-.68C7.82 2.52 9.86 2 12.01 2c2.13 0 3.99.47 5.76 1.48.24.14.32.44.18.68-.09.18-.28.31-.48.31zM3.5 9.72c-.1 0-.2-.03-.29-.09-.23-.15-.3-.46-.15-.7.9-1.42 2.06-2.58 3.45-3.46.23-.15.54-.08.69.15.15.23.08.54-.15.69-1.27.81-2.33 1.88-3.16 3.18-.1.15-.27.23-.44.23zm10.02 12.06c-.05 0-.1 0-.15-.02-2.6-.57-4.52-2.1-5.72-4.55-.99-2.03-1.07-4.75-.24-8.08.06-.27.33-.43.6-.37.27.06.44.33.37.6-.78 3.13-.7 5.67.22 7.56 1.11 2.27 2.89 3.69 5.31 4.22.27.06.44.33.38.6-.05.23-.25.42-.47.42zm4.72-4.48c-.09 0-.19-.03-.27-.08-.23-.14-.3-.45-.16-.68 1.42-2.35 1.76-4.66 1.01-6.88-.67-1.98-2.36-3.35-4.4-3.56-.27-.03-.47-.27-.44-.54.03-.27.27-.47.54-.44 2.37.24 4.33 1.83 5.11 4.14.88 2.61.48 5.32-1.18 8.08-.09.15-.26.24-.43.24zm-6.22-4.3c-.7 0-1.28-.57-1.28-1.28v-2.06c0-1.14.93-2.06 2.06-2.06s2.06.93 2.06 2.06v2.06c0 .71-.58 1.28-1.28 1.28h-1.56zm.78-4.34c-.58 0-1.06.48-1.06 1.06v2.06c0 .15.12.28.28.28h1.56c.15 0 .28-.12.28-.28v-2.06c0-.58-.48-1.06-1.06-1.06z"/>
            </svg>
          </div>
          <div>
            <div class="bio-seal-title">
              <span class="badge-tag green">✓ BIOMETRIC THUMBPRINT VERIFIED</span>
              <span class="bio-ref">${bio.token}</span>
            </div>
            <div class="bio-seal-desc">
              UIDAI e-KYC Attested • Match Confidence: <strong>${bio.match_score}</strong><br>
              Signatory: <strong>${profile.account_holder || bio.customer_name || 'Applicant'}</strong> • Verified: <strong>${bio.timestamp}</strong>
            </div>
            <div class="bio-seal-note">
              🛡️ Paperless Certified: Physical printing & ink signature completely eliminated.
            </div>
          </div>
        </div>
      `;
    } else {
      bioHtml = `
        <div class="biometric-seal-card pending">
          <div class="bio-seal-icon pending">
            👆
          </div>
          <div>
            <div class="bio-seal-title">
              <span class="badge-tag amber">⚠️ BIOMETRIC THUMBPRINT ATTESTATION REQUIRED</span>
            </div>
            <div class="bio-seal-desc">
              Bank policy eliminates paper printing and manual signature.<br>
              Customer must complete <strong>Biometric Thumbprint Verification</strong> to digitally sign and forward to Counter 2.
            </div>
            <button type="button" class="btn btn-sm btn-primary" style="margin-top:0.5rem;" onclick="BiometricScanner.openScanner()">
              👆 Scan Thumbprint on Optical Sensor
            </button>
          </div>
        </div>
      `;
    }

    let counter2Html = '';
    if (app) {
      if (app.status === 'APPROVED') {
        counter2Html = `
          <div class="counter-status-card approved">
            <div class="counter-badge green">✅ COUNTER 2: APPROVED & FINALIZED</div>
            <div class="counter-detail">
              Approved by: <strong>${app.officer_decision?.officer_name || 'Senior Branch Operations Officer'}</strong> (ID: ${app.officer_decision?.officer_id || 'BO-88214'})<br>
              Decision Time: <strong>${app.officer_decision?.decided_at || new Date().toLocaleString()}</strong><br>
              Application Ref ID: <strong style="font-family:monospace;">${app.id}</strong>
            </div>
            ${app.officer_decision?.feedback ? `<div class="officer-feedback-quote">Officer Remarks: "${app.officer_decision.feedback}"</div>` : ''}
          </div>
        `;
      } else if (app.status === 'REJECTED') {
        counter2Html = `
          <div class="counter-status-card rejected">
            <div class="counter-badge red">❌ COUNTER 2: REJECTED / ACTION REQUIRED</div>
            <div class="counter-detail">
              Officer: <strong>${app.officer_decision?.officer_name || 'Verification Desk'}</strong> (ID: ${app.officer_decision?.officer_id || 'BO-88214'})<br>
              Status: Application returned to customer for corrections.
            </div>
            <div class="officer-feedback-alert">
              <strong>Officer Feedback Remarks:</strong><br>
              "${app.officer_decision?.feedback || 'Please update your form details.'}"
            </div>
            <button type="button" class="btn btn-sm btn-primary" style="margin-top:0.6rem;" onclick="FormsManager.resubmitCurrentApplication()">
              ✏️ Modify Details & Re-Forward to Counter 2
            </button>
          </div>
        `;
      } else {
        counter2Html = `
          <div class="counter-status-card pending-queue">
            <div class="counter-badge amber">⏳ FORWARDED TO COUNTER 2: UNDER REVIEW</div>
            <div class="counter-detail">
              Application ID: <strong style="font-family:monospace;">${app.id}</strong><br>
              Desk: <strong>Counter 2 - Maker/Checker Verification Officer</strong><br>
              Routing Time: <strong>${app.submitted_at}</strong>
            </div>
            <div style="font-size:0.8rem; color:#475569; margin-top:5px;">
              Your form & biometric thumbprint are in the Counter 2 review queue. No paper printing or physical queues needed!
            </div>
          </div>
        `;
      }
    } else {
      counter2Html = `
        <div class="counter-status-card awaiting">
          <div class="counter-badge gray">🏛️ COUNTER 2: READY FOR FORWARDING</div>
          <div class="counter-detail">
            Once thumbprint is verified, clicking <strong>"Forward to Counter 2"</strong> instantly routes your application to the Bank Officer for approval.
          </div>
          <div style="font-size:0.75rem; color:#64748b; margin-top:4px;">
            Eliminates paper forms, manual signatures, and waiting in queues!
          </div>
        </div>
      `;
    }

    return `
      <div class="digital-attestation-container" id="digitalAttestationContainer">
        <div class="form-section-title">5. PAPERLESS BIOMETRIC ATTESTATION & COUNTER ROUTING (NO PAPER / NO INK)</div>
        <div class="attestation-grid">
          ${bioHtml}
          ${counter2Html}
        </div>
      </div>
    `;
  },

  forms: {
    account_opening: {
      name: "Account Opening Form",
      badge: "Form AOF-01",
      render(profile) {
        const p = profile || {};
        return `
          <div class="bank-form-paper" id="activeBankFormPaper">
            <div class="form-paper-header">
              <div>
                <div class="form-paper-bank" id="paperBankTitle">${p.bank_name || "STATE BANK OF INDIA"}</div>
                <div class="form-paper-title">CUSTOMER ONBOARDING & ACCOUNT OPENING APPLICATION</div>
                <div style="font-size:0.85rem; color:#64748b; margin-top:4px;">PAPERLESS DIGITAL SUBMISSION • NO PHYSICAL INK SIGNATURE REQUIRED</div>
              </div>
              <div class="form-paper-meta">
                <div>REF: AOF-${new Date().getFullYear()}-0982</div>
                <div>DATE: <strong>${new Date().toLocaleDateString()}</strong></div>
                <div>MODE: <span style="color:#059669; font-weight:700;">DIGITAL BIOMETRIC e-KYC</span></div>
              </div>
            </div>

            <div class="form-section-title">1. BRANCH & GENERAL INFORMATION</div>
            <div class="paper-grid">
              <div class="paper-field col-6">
                <label>Branch Name & City</label>
                <input type="text" class="paper-input" data-field="branch_name" value="${p.branch_name || ''}" placeholder="Branch Name">
              </div>
              <div class="paper-field col-3">
                <label>Branch Code / SOL ID</label>
                <input type="text" class="paper-input" data-field="branch_code" value="${p.branch_code || ''}" placeholder="SOL ID">
              </div>
              <div class="paper-field col-3">
                <label>IFSC Code</label>
                <input type="text" class="paper-input" data-field="ifsc_code" value="${p.ifsc_code || ''}" placeholder="11-digit IFSC">
              </div>
            </div>

            <div class="form-section-title">2. APPLICANT PERSONAL DETAILS</div>
            <div class="paper-grid">
              <div class="paper-field col-8">
                <label>Full Name of Account Holder (from Passbook)</label>
                <input type="text" class="paper-input" data-field="account_holder" value="${p.account_holder || ''}" placeholder="Full Name">
              </div>
              <div class="paper-field col-4">
                <label>Account Type Required</label>
                <input type="text" class="paper-input" data-field="account_type" value="${p.account_type || 'SAVINGS ACCOUNT'}" placeholder="Account Type">
              </div>
              <div class="paper-field col-4">
                <label>Customer ID / CIF (Existing)</label>
                <input type="text" class="paper-input" data-field="cif_number" value="${p.cif_number || ''}" placeholder="CIF Number">
              </div>
              <div class="paper-field col-4">
                <label>Mobile Number (+91)</label>
                <input type="text" class="paper-input" data-field="mobile" value="${p.mobile || ''}" placeholder="10-digit Mobile">
              </div>
              <div class="paper-field col-4">
                <label>Registered Email Address</label>
                <input type="email" class="paper-input" data-field="email" value="${p.email || ''}" placeholder="Email Address">
              </div>
            </div>

            <div class="form-section-title">3. RESIDENTIAL / CORRESPONDENCE ADDRESS</div>
            <div class="paper-grid">
              <div class="paper-field col-12">
                <label>Permanent Residential Address</label>
                <input type="text" class="paper-input" data-field="address" value="${p.address || ''}" placeholder="Door No, Street, Landmark, City, State, PIN">
              </div>
            </div>

            <div class="form-section-title">4. BANK ACCOUNT LINKING & PASSBOOK DETAILS</div>
            <div class="paper-grid">
              <div class="paper-field col-6">
                <label>Linked Primary Account Number</label>
                <input type="text" class="paper-input" data-field="account_number" value="${p.account_number || ''}" placeholder="Account Number">
              </div>
              <div class="paper-field col-3">
                <label>MICR Code</label>
                <input type="text" class="paper-input" data-field="micr_code" value="${p.micr_code || ''}" placeholder="9-digit MICR">
              </div>
              <div class="paper-field col-3">
                <label>Passbook Issue Date</label>
                <input type="text" class="paper-input" data-field="issue_date" value="${p.issue_date || ''}" placeholder="DD/MM/YYYY">
              </div>
            </div>

            ${FormsManager.renderDigitalAttestationBlock(p)}
          </div>
        `;
      }
    },

    funds_transfer: {
      name: "NEFT / RTGS Pay-in Slip",
      badge: "Form TRF-02",
      render(profile) {
        const p = profile || {};
        return `
          <div class="bank-form-paper" id="activeBankFormPaper">
            <div class="form-paper-header">
              <div>
                <div class="form-paper-bank">${p.bank_name || "BANK OF INDIA"}</div>
                <div class="form-paper-title">NEFT / RTGS / IMPS FUNDS TRANSFER VOUCHER</div>
                <div style="font-size:0.85rem; color:#64748b;">DIGITAL REMITTANCE APPLICATION • PAPERLESS BIOMETRIC SETTLEMENT</div>
              </div>
              <div class="form-paper-meta">
                <div>UTR NO: <strong>GEN-${Math.floor(100000000 + Math.random() * 900000000)}</strong></div>
                <div>DATE: <strong>${new Date().toLocaleDateString()}</strong></div>
              </div>
            </div>

            <div class="form-section-title">REMITTER (APPLICANT) DETAILS</div>
            <div class="paper-grid">
              <div class="paper-field col-6">
                <label>Remitter Name</label>
                <input type="text" class="paper-input" data-field="account_holder" value="${p.account_holder || ''}">
              </div>
              <div class="paper-field col-6">
                <label>Debit Account Number</label>
                <input type="text" class="paper-input" data-field="account_number" value="${p.account_number || ''}">
              </div>
              <div class="paper-field col-4">
                <label>Remitter Bank</label>
                <input type="text" class="paper-input" data-field="bank_name" value="${p.bank_name || ''}">
              </div>
              <div class="paper-field col-4">
                <label>Remitter IFSC Code</label>
                <input type="text" class="paper-input" data-field="ifsc_code" value="${p.ifsc_code || ''}">
              </div>
              <div class="paper-field col-4">
                <label>Contact Mobile</label>
                <input type="text" class="paper-input" data-field="mobile" value="${p.mobile || ''}">
              </div>
            </div>

            <div class="form-section-title">BENEFICIARY DETAILS</div>
            <div class="paper-grid">
              <div class="paper-field col-6">
                <label>Beneficiary Name</label>
                <input type="text" class="paper-input" value="SHIVA ASSOCIATES PVT LTD">
              </div>
              <div class="paper-field col-6">
                <label>Beneficiary Account Number</label>
                <input type="text" class="paper-input" value="982301928472">
              </div>
              <div class="paper-field col-4">
                <label>Beneficiary IFSC Code</label>
                <input type="text" class="paper-input" value="HDFC0000123">
              </div>
              <div class="paper-field col-4">
                <label>Transfer Amount (INR)</label>
                <input type="text" class="paper-input" value="₹ 45,000.00">
              </div>
              <div class="paper-field col-4">
                <label>Transfer Mode</label>
                <input type="text" class="paper-input" value="NEFT (Immediate Settlement)">
              </div>
            </div>

            ${FormsManager.renderDigitalAttestationBlock(p)}
          </div>
        `;
      }
    },

    cheque_debit: {
      name: "Cheque Book & Card Request",
      badge: "Form SRV-03",
      render(profile) {
        const p = profile || {};
        return `
          <div class="bank-form-paper" id="activeBankFormPaper">
            <div class="form-paper-header">
              <div>
                <div class="form-paper-bank">${p.bank_name || "RETAIL BANK"}</div>
                <div class="form-paper-title">SERVICE REQUEST: CHEQUE BOOK & DEBIT CARD REQUISITION</div>
                <div style="font-size:0.85rem; color:#64748b;">DIGITAL DISPATCH REQUEST • E-KYC THUMBPRINT AUTHORIZED</div>
              </div>
              <div class="form-paper-meta">
                <div>REQ ID: <strong>SR-${Date.now().toString().slice(-6)}</strong></div>
                <div>DATE: <strong>${new Date().toLocaleDateString()}</strong></div>
              </div>
            </div>

            <div class="form-section-title">ACCOUNT IDENTIFICATION</div>
            <div class="paper-grid">
              <div class="paper-field col-6">
                <label>Account Number</label>
                <input type="text" class="paper-input" data-field="account_number" value="${p.account_number || ''}">
              </div>
              <div class="paper-field col-6">
                <label>Primary Account Holder</label>
                <input type="text" class="paper-input" data-field="account_holder" value="${p.account_holder || ''}">
              </div>
              <div class="paper-field col-4">
                <label>Customer CIF ID</label>
                <input type="text" class="paper-input" data-field="cif_number" value="${p.cif_number || ''}">
              </div>
              <div class="paper-field col-4">
                <label>MICR Code</label>
                <input type="text" class="paper-input" data-field="micr_code" value="${p.micr_code || ''}">
              </div>
              <div class="paper-field col-4">
                <label>Branch Name</label>
                <input type="text" class="paper-input" data-field="branch_name" value="${p.branch_name || ''}">
              </div>
            </div>

            <div class="form-section-title">DELIVERY PREFERENCES</div>
            <div class="paper-grid">
              <div class="paper-field col-8">
                <label>Dispatch Address (Registered Address from Passbook)</label>
                <input type="text" class="paper-input" data-field="address" value="${p.address || ''}">
              </div>
              <div class="paper-field col-4">
                <label>Delivery SMS Contact</label>
                <input type="text" class="paper-input" data-field="mobile" value="${p.mobile || ''}">
              </div>
              <div class="paper-field col-6">
                <label>Cheque Book Required</label>
                <input type="text" class="paper-input" value="Personalised (50 Leaves, Multi-City)">
              </div>
              <div class="paper-field col-6">
                <label>Debit Card Variant</label>
                <input type="text" class="paper-input" value="Platinum Chip International Contactless">
              </div>
            </div>

            ${FormsManager.renderDigitalAttestationBlock(p)}
          </div>
        `;
      }
    },

    kyc_update: {
      name: "KYC Updation / Re-KYC Form",
      badge: "Form KYC-04",
      render(profile) {
        const p = profile || {};
        return `
          <div class="bank-form-paper" id="activeBankFormPaper">
            <div class="form-paper-header">
              <div>
                <div class="form-paper-bank">${p.bank_name || "BANK"}</div>
                <div class="form-paper-title">PERIODIC RE-KYC / CUSTOMER PROFILE ATTESTATION</div>
                <div style="font-size:0.85rem; color:#64748b;">CENTRAL CKYC REGISTRY ATTESTATION • NO PAPER INK SIGNATURES</div>
              </div>
              <div class="form-paper-meta">
                <div>KYC STATUS: <strong style="color:#059669;">PASSBOOK OCR VERIFIED</strong></div>
                <div>DATE: <strong>${new Date().toLocaleDateString()}</strong></div>
              </div>
            </div>

            <div class="form-section-title">KYC HOLDER ATTRIBUTES</div>
            <div class="paper-grid">
              <div class="paper-field col-6">
                <label>Customer Name</label>
                <input type="text" class="paper-input" data-field="account_holder" value="${p.account_holder || ''}">
              </div>
              <div class="paper-field col-6">
                <label>Account Number</label>
                <input type="text" class="paper-input" data-field="account_number" value="${p.account_number || ''}">
              </div>
              <div class="paper-field col-4">
                <label>Customer ID (CIF)</label>
                <input type="text" class="paper-input" data-field="cif_number" value="${p.cif_number || ''}">
              </div>
              <div class="paper-field col-4">
                <label>Registered Mobile</label>
                <input type="text" class="paper-input" data-field="mobile" value="${p.mobile || ''}">
              </div>
              <div class="paper-field col-4">
                <label>Email Address</label>
                <input type="text" class="paper-input" data-field="email" value="${p.email || ''}">
              </div>
              <div class="paper-field col-12">
                <label>Current Address Proof (From Passbook Scan)</label>
                <input type="text" class="paper-input" data-field="address" value="${p.address || ''}">
              </div>
            </div>

            ${FormsManager.renderDigitalAttestationBlock(p)}
          </div>
        `;
      }
    },

    fixed_deposit: {
      name: "Fixed Deposit (FD) Application",
      badge: "Form TDR-05",
      render(profile) {
        const p = profile || {};
        return `
          <div class="bank-form-paper" id="activeBankFormPaper">
            <div class="form-paper-header">
              <div>
                <div class="form-paper-bank">${p.bank_name || "BANK"}</div>
                <div class="form-paper-title">TERM / FIXED DEPOSIT (FD) CREATION FORM</div>
                <div style="font-size:0.85rem; color:#64748b;">DIGITAL TERM DEPOSIT APPOINTMENT • NO PAPERWORK</div>
              </div>
              <div class="form-paper-meta">
                <div>FD SCHEME: <strong>CUMULATIVE REINVESTMENT</strong></div>
                <div>DATE: <strong>${new Date().toLocaleDateString()}</strong></div>
              </div>
            </div>

            <div class="form-section-title">DEPOSITOR & FUNDING SOURCE</div>
            <div class="paper-grid">
              <div class="paper-field col-6">
                <label>Primary Depositor Name</label>
                <input type="text" class="paper-input" data-field="account_holder" value="${p.account_holder || ''}">
              </div>
              <div class="paper-field col-6">
                <label>Debit Savings Account (Funding A/C)</label>
                <input type="text" class="paper-input" data-field="account_number" value="${p.account_number || ''}">
              </div>
              <div class="paper-field col-4">
                <label>Customer CIF</label>
                <input type="text" class="paper-input" data-field="cif_number" value="${p.cif_number || ''}">
              </div>
              <div class="paper-field col-4">
                <label>Deposit Amount (INR)</label>
                <input type="text" class="paper-input" value="₹ 1,00,000.00">
              </div>
              <div class="paper-field col-4">
                <label>Tenure</label>
                <input type="text" class="paper-input" value="3 Years (7.50% p.a.)">
              </div>
              <div class="paper-field col-8">
                <label>Maturity Credit Account</label>
                <input type="text" class="paper-input" data-field="account_number" value="${p.account_number || ''}">
              </div>
              <div class="paper-field col-4">
                <label>Maturity Payout IFSC</label>
                <input type="text" class="paper-input" data-field="ifsc_code" value="${p.ifsc_code || ''}">
              </div>
            </div>

            ${FormsManager.renderDigitalAttestationBlock(p)}
          </div>
        `;
      }
    },

    portal_simulator: {
      name: "External Bank Portal Simulator",
      badge: "Simulation",
      render(profile) {
        const p = profile || {};
        return `
          <div style="background: #111827; border: 1px solid #374151; border-radius: 12px; padding: 1.5rem; color: #f9fafb; margin-bottom:1.5rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #374151; padding-bottom:0.75rem; margin-bottom:1.25rem;">
              <div style="display:flex; align-items:center; gap:0.5rem;">
                <span style="display:inline-block; width:12px; height:12px; background:#ef4444; border-radius:50%;"></span>
                <span style="display:inline-block; width:12px; height:12px; background:#f59e0b; border-radius:50%;"></span>
                <span style="display:inline-block; width:12px; height:12px; background:#10b981; border-radius:50%;"></span>
                <span style="font-size:0.85rem; color:#9ca3af; margin-left:8px; font-family:monospace;">https://ebank.netbanking-portal.gov.in/apply</span>
              </div>
              <span style="font-size:0.75rem; background:#1e3a8a; color:#93c5fd; padding:3px 8px; border-radius:6px;">Target Third-Party Portal</span>
            </div>

            <div style="margin-bottom:1rem; font-size:0.95rem; font-weight:600; color:#e5e7eb;">
              Simulated Online Banking Application Webpage
            </div>

            <div class="paper-grid" style="row-gap: 1rem;">
              <div class="paper-field col-6">
                <label style="color:#9ca3af;">Beneficiary Bank</label>
                <input type="text" class="paper-input" data-field="bank_name" value="${p.bank_name || ''}" style="background:#1f2937; border-color:#4b5563; color:#f9fafb;">
              </div>
              <div class="paper-field col-6">
                <label style="color:#9ca3af;">Branch Name</label>
                <input type="text" class="paper-input" data-field="branch_name" value="${p.branch_name || ''}" style="background:#1f2937; border-color:#4b5563; color:#f9fafb;">
              </div>
              <div class="paper-field col-6">
                <label style="color:#9ca3af;">Account Holder Name</label>
                <input type="text" class="paper-input" data-field="account_holder" value="${p.account_holder || ''}" style="background:#1f2937; border-color:#4b5563; color:#f9fafb;">
              </div>
              <div class="paper-field col-6">
                <label style="color:#9ca3af;">Account Number</label>
                <input type="text" class="paper-input" data-field="account_number" value="${p.account_number || ''}" style="background:#1f2937; border-color:#4b5563; color:#f9fafb;">
              </div>
              <div class="paper-field col-4">
                <label style="color:#9ca3af;">IFSC Code</label>
                <input type="text" class="paper-input" data-field="ifsc_code" value="${p.ifsc_code || ''}" style="background:#1f2937; border-color:#4b5563; color:#f9fafb;">
              </div>
              <div class="paper-field col-4">
                <label style="color:#9ca3af;">Customer CIF</label>
                <input type="text" class="paper-input" data-field="cif_number" value="${p.cif_number || ''}" style="background:#1f2937; border-color:#4b5563; color:#f9fafb;">
              </div>
              <div class="paper-field col-4">
                <label style="color:#9ca3af;">MICR Code</label>
                <input type="text" class="paper-input" data-field="micr_code" value="${p.micr_code || ''}" style="background:#1f2937; border-color:#4b5563; color:#f9fafb;">
              </div>
              <div class="paper-field col-12">
                <label style="color:#9ca3af;">Contact & Billing Address</label>
                <input type="text" class="paper-input" data-field="address" value="${p.address || ''}" style="background:#1f2937; border-color:#4b5563; color:#f9fafb;">
              </div>
            </div>
            ${FormsManager.renderDigitalAttestationBlock(p)}
          </div>
        `;
      }
    }
  },

  selectForm(formId, profile) {
    this.currentFormId = formId;
    const container = document.getElementById("activeFormContainer");
    if (!container || !this.forms[formId]) return;

    container.innerHTML = this.forms[formId].render(profile);
    
    // Update active tab pill
    document.querySelectorAll(".form-pill").forEach(pill => {
      pill.classList.toggle("active", pill.dataset.formId === formId);
    });

    // Automatically trigger autofill highlight animation
    if (profile && profile.account_number) {
      this.animateAutoFill(profile);
    }

    this.updateForwardButtonState();
  },

  animateAutoFill(profile) {
    if (!profile) return;
    const inputs = document.querySelectorAll("#activeFormContainer input[data-field]");
    inputs.forEach((input, index) => {
      const fieldKey = input.dataset.field;
      if (profile[fieldKey] !== undefined && profile[fieldKey] !== "") {
        setTimeout(() => {
          input.value = profile[fieldKey];
          input.classList.add("highlight-fill");
          setTimeout(() => input.classList.remove("highlight-fill"), 1600);
        }, index * 30);
      }
    });
  },

  setBiometricVerification(bioData) {
    this.currentBiometric = bioData;
    this.updateFormAttestationUI();
    this.updateForwardButtonState();
  },

  updateFormAttestationUI() {
    const container = document.getElementById("digitalAttestationContainer");
    if (!container) return;
    const p = (window.App && window.App.currentProfile) ? window.App.currentProfile : {};
    container.outerHTML = this.renderDigitalAttestationBlock(p);
    this.updateForwardButtonState();
  },

  updateForwardButtonState() {
    const forwardBtn = document.getElementById("forwardCounter2Btn");
    const thumbBtn = document.getElementById("triggerThumbprintBtn");

    if (this.currentBiometric && this.currentBiometric.verified) {
      if (forwardBtn) {
        forwardBtn.disabled = false;
        forwardBtn.classList.remove("btn-secondary");
        forwardBtn.classList.add("btn-primary");
      }
      if (thumbBtn) {
        thumbBtn.innerHTML = "✓ Thumbprint Verified";
        thumbBtn.classList.remove("btn-primary");
        thumbBtn.classList.add("btn-success");
      }
    } else {
      if (forwardBtn) {
        forwardBtn.disabled = true;
        forwardBtn.classList.add("btn-secondary");
        forwardBtn.classList.remove("btn-primary");
      }
      if (thumbBtn) {
        thumbBtn.innerHTML = "👆 2. Verify Thumbprint";
        thumbBtn.classList.remove("btn-success");
        thumbBtn.classList.add("btn-primary");
      }
    }
  },

  async forwardToCounter2() {
    if (!this.currentBiometric || !this.currentBiometric.verified) {
      alert("Biometric Thumbprint is required before forwarding to Counter 2. Please click 'Verify Thumbprint' on the optical sensor first.");
      if (window.BiometricScanner) window.BiometricScanner.openScanner();
      return;
    }

    const formInputs = {};
    document.querySelectorAll("#activeFormContainer input[data-field]").forEach(input => {
      formInputs[input.dataset.field] = input.value;
    });

    const activeFormDef = this.forms[this.currentFormId];
    const formName = activeFormDef ? activeFormDef.name : "Bank Application Form";
    const profile = window.App ? window.App.currentProfile : {};

    const payload = {
      form_id: this.currentFormId,
      form_name: formName,
      form_data: formInputs,
      biometric_data: this.currentBiometric,
      passbook_data: profile
    };

    const forwardBtn = document.getElementById("forwardCounter2Btn");
    if (forwardBtn) {
      forwardBtn.disabled = true;
      forwardBtn.innerHTML = '<span class="spinner"></span> Routing to Counter 2...';
    }

    try {
      const res = await fetch("/api/applications/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.application) {
          this.activeApplication = data.application;
        }
      }
    } catch (e) {
      console.warn("Backend submit error, using local queue", e);
      // Fallback local application creation
      this.activeApplication = {
        id: `APP-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`,
        form_id: this.currentFormId,
        form_name: formName,
        form_data: formInputs,
        passbook_data: profile,
        biometric_data: this.currentBiometric,
        customer_name: formInputs.account_holder || profile.account_holder || "Applicant",
        bank_name: formInputs.bank_name || profile.bank_name || "Bank",
        account_number: formInputs.account_number || profile.account_number || "N/A",
        submitted_at: new Date().toLocaleDateString() + ", " + new Date().toLocaleTimeString(),
        status: "PENDING_COUNTER_2",
        officer_decision: null
      };

      if (window.Counter2) {
        window.Counter2.applications.unshift(this.activeApplication);
        window.Counter2.saveLocalBackup();
      }
    } finally {
      if (forwardBtn) {
        forwardBtn.disabled = false;
        forwardBtn.innerHTML = "🚀 Application Forwarded to Counter 2";
      }
    }

    this.updateFormAttestationUI();

    if (window.Counter2) {
      window.Counter2.loadApplications(true);
    }

    if (window.App) {
      window.App.notifySuccess(`Application ${this.activeApplication.id} routed to Counter 2! You can switch to Tab 4 (Counter 2: Officer Desk) to approve or review it.`);
    }
  },

  resubmitCurrentApplication() {
    this.activeApplication = null;
    this.updateFormAttestationUI();
    if (window.App) {
      window.App.notifySuccess("Application unlocked for corrections. Update details and click 'Forward to Counter 2' when ready.");
    }
  },

  printActiveForm() {
    window.print();
  }
};

window.FormsManager = FormsManager;
