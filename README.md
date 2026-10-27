# AutoBankFill - Paperless Bank Passbook OCR & Biometric Form Filling System

An automated, paperless banking system that extracts customer details from bank passbooks via OCR, auto-fills official banking forms, validates identity with **Biometric Thumbprint Verification**, and seamlessly routes applications to **Counter 2 (Bank Officer Maker-Checker Desk)** for approval or feedback remarks — eliminating printing, ink signatures, and physical queues.

---

## 🌟 Modern Paperless Workflow (End-to-End)

```
[Customer Passbook Upload / Scan] 
        │
        ▼
[Instant OCR & Entity Recognition] (Name, A/C, IFSC, CIF, MICR, Branch, Address)
        │
        ▼
[Automatic Form Filling] (Account Opening, NEFT/RTGS, Cheque/Debit, Re-KYC, FD)
        │
        ▼
[Biometric Thumbprint Attestation] 
(Optical scanner captures minutiae ridges, binds UIDAI/e-KYC token BIO-UIDAI-XXXX)
        │
        ▼
[Direct Auto-Forward to Counter 2 (No Printing • No Ink Signatures • No Queues)]
        │
        ▼
[Counter 2: Bank Officer Maker-Checker Desk]
 ├── ✅ 1-Click Approved ──► Digital Attestation Finalized & Customer Notified
 └── ❌ Returned with Feedback ──► Officer writes feedback/reason ──► Customer edits & resubmits immediately
```

---

## 🚀 Key Features

1. **Dual-Engine OCR Pipeline**:
   - **Local & Offline Execution**: Uses hardware-accelerated Windows Media OCR and WebAssembly Tesseract.js fallback for cloud/Vercel.
   - **OpenCV Enhancement**: Deskewing, noise filtering, and CLAHE adaptive contrast optimization.
   - **Indian Banking Entity Parser**: IFSC with RBI prefix validation, Account Number (9–18 digits), CIF/CRN, MICR, Branch Name, SOL ID, Account Type, Registered Address, Mobile, and Email.
   - **Pre-Loaded Sample Passbooks**: Instant 1-click testing with pre-generated passbooks for SBI, HDFC, ICICI, PNB, and Axis Bank.

2. **Paperless Form Auto-Filling**:
   - **Official Form Templates**:
     1. *Savings / Current Account Opening Application*
     2. *NEFT / RTGS / IMPS Funds Transfer Pay-in Slip*
     3. *Cheque Book & Debit Card Request Form*
     4. *Periodic Re-KYC / Customer Profile Attestation*
     5. *Term / Fixed Deposit (FD) Creation Form*
     6. *External Netbanking Portal Simulator*
   - Dynamic animated auto-filling with field-by-field verification.

3. **Biometric Thumbprint Verification**:
   - Eliminates physical paper printing and manual ink signatures.
   - Interactive optical scanner simulation with laser ridge sweep, 500 DPI minutiae capture, and UIDAI/Bank biometric e-KYC score (99.8%).
   - Cryptographically binds a unique attestation token (`BIO-UIDAI-YYYY-XXXX`) into the application payload.

4. **Counter 2: Bank Officer Maker-Checker Desk**:
   - Real-time queue displaying inbound customer submissions.
   - Queue dashboard counters: Total, Awaiting Officer Action, Approved & Dispatched, and Returned with Feedback.
   - Officer Application Inspection Modal with complete field-level verification.
   - **1-Click Approval**: Instant clearance and digital certification.
   - **Rejection with Feedback Remarks**: Officer writes specific feedback/instructions (with quick templates for account number mismatch, IFSC updates, KYC requirements) so the customer can correct and resubmit without standing in lines.

5. **Security & Privacy Architecture**:
   - **Direct Access**: No password friction barrier.
   - **Zero-Leak Privacy**: Sensitive banking images processed locally.
   - **Data Masking**: 1-click toggle to mask/reveal sensitive account numbers (`•••• •••• 2019`).
   - **Panic Wipe**: Instantly purge cached profile data with one click.
   - **Security Audit Trail**: Logs timestamped records of all scans, biometric attestations, officer approvals, and feedback dispatches.

---

## 🏁 Quick Start

### 1. Requirements
- Python 3.10+
- Modern Web Browser (Chrome, Edge, Firefox)

### 2. Launch Local Server
```powershell
python run.py
```
Or directly using Uvicorn:
```powershell
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

Open your browser to:
[http://127.0.0.1:8000](http://127.0.0.1:8000)

---

## 🧪 Testing the New Flow in 30 Seconds

1. Click **SBI** (or any sample bank) on Step 1 to load sample passbook.
2. Click **"Auto-Fill Forms →"** to enter Step 3.
3. Click **"⚡ 1. Auto-Fill Form"** to populate all fields.
4. Click **"👆 2. Verify Thumbprint"** and click the optical sensor pad to capture biometric attestation.
5. Click **"🚀 3. Forward to Counter 2"**.
6. Switch to Tab 4 (**Counter 2: Officer Desk**) to see your application in the queue.
7. Click **"🔎 Review Application"** to either **Approve** or **Reject / Return with Feedback**.
