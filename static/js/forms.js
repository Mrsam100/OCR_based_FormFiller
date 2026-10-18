/**
 * Bank Forms Definition, Field Mapping & Instant Auto-Fill Engine
 */
const FormsManager = {
  currentFormId: "account_opening",

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
                <div style="font-size:0.85rem; color:#64748b; margin-top:4px;">FOR INDIVIDUAL RESIDENT SAVINGS / CURRENT ACCOUNTS</div>
              </div>
              <div class="form-paper-meta">
                <div>FORM REF: AOF-${new Date().getFullYear()}-0982</div>
                <div>DATE: <strong>${new Date().toLocaleDateString()}</strong></div>
                <div>STATUS: <span style="color:#059669; font-weight:700;">PRE-VERIFIED VIA OCR</span></div>
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
                <label>Full Name of Account Holder (as in Passbook)</label>
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
                <label>Account Opening / Issue Date</label>
                <input type="text" class="paper-input" data-field="issue_date" value="${p.issue_date || ''}" placeholder="DD/MM/YYYY">
              </div>
            </div>

            <div class="paper-signatures">
              <div class="signature-box">Signature of Applicant<br><strong>${p.account_holder || ''}</strong></div>
              <div class="signature-box">Verified by Branch Officer<br>(Sign & Stamp)</div>
              <div class="signature-box">Branch Manager Approval<br>Authorized Signatory</div>
            </div>
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
                <div style="font-size:0.85rem; color:#64748b;">CUSTOMER DEBIT & REMITTANCE APPLICATION</div>
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

            <div class="paper-signatures">
              <div class="signature-box">Applicant Signature<br><strong>${p.account_holder || ''}</strong></div>
              <div class="signature-box">Maker Officer Stamp</div>
              <div class="signature-box">Checker Officer Stamp</div>
            </div>
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

            <div class="paper-signatures">
              <div class="signature-box">Customer Signature<br><strong>${p.account_holder || ''}</strong></div>
              <div class="signature-box">Signature Verified By Bank Officer</div>
              <div class="signature-box">Dispatch Tracking / AWB No</div>
            </div>
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
              </div>
              <div class="form-paper-meta">
                <div>KYC STATUS: <strong style="color:#059669;">PASSBOOK VERIFIED</strong></div>
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
                <label>Current Address Proof (From Passbook Stamp)</label>
                <input type="text" class="paper-input" data-field="address" value="${p.address || ''}">
              </div>
            </div>

            <div class="paper-signatures">
              <div class="signature-box">Applicant Signature<br><strong>${p.account_holder || ''}</strong></div>
              <div class="signature-box">KYC Verifier Seal</div>
              <div class="signature-box">Central KYC (CKYC) Registry Synced</div>
            </div>
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

            <div class="paper-signatures">
              <div class="signature-box">Depositor Signature<br><strong>${p.account_holder || ''}</strong></div>
              <div class="signature-box">Bank Fixed Deposit Officer</div>
              <div class="signature-box">TDR Certificate Issued</div>
            </div>
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
        }, index * 40);
      }
    });
  },

  printActiveForm() {
    window.print();
  }
};
