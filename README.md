# AutoBankFill - Automated Bank Passbook OCR & Form Filling System

An automated, privacy-first web application that extracts information from bank passbooks (or cancelled cheques) via OCR and instantly populates multiple official bank forms.

---

## 🌟 Key Features

1. **High-Precision Passbook OCR Pipeline**:
   - **Local & Offline Execution**: Uses hardware-accelerated Windows Media OCR via `winocr` and OpenCV. No private banking images are sent to third-party cloud APIs.
   - **OpenCV Image Enhancement**: Automated deskewing, noise reduction, and CLAHE adaptive contrast optimization for scanned documents or photos.
   - **Spatial Line & Entity Reconstruction**: Reconstructs multi-column passbook layouts and matches labels to values using 2D coordinate grouping.
   - **Indian Banking Entity Parser**:
     - **IFSC Code** with RBI prefix validation (e.g. `SBIN` -> State Bank of India, `HDFC` -> HDFC Bank, `ICIC` -> ICICI Bank, etc.)
     - **Account Number** (9 to 18 digits)
     - **Customer ID / CIF / CRN**
     - **MICR Code** (9 digits)
     - **Account Holder Name**
     - **Branch Name & SOL ID / Branch Code**
     - **Account Type** (Savings, Current, Salary, FD, RD)
     - **Registered Address & PIN code**
     - **Mobile Number & Email Address**
     - **Passbook Issue / Opening Date**

2. **Security & Generic Master Password**:
   - **Generic Master Password**: Locks the application with a master passphrase (Default: `BankShield@2026`).
   - **Vault Authentication**: Cryptographic token session storage with customizable auto-lock timer (default: 5 minutes of inactivity).
   - **Sensitive Data Masking**: 1-click toggle to mask/unmask sensitive account and CIF numbers (`•••• •••• 2019`).
   - **Panic Wipe Button**: Instantly terminates active session and clears all memory and profile traces.
   - **Security Audit Trail**: Logs timestamped records of all scan, login, and autofill actions.

3. **Instant Bank Form Auto-Filling**:
   - **Official Bank Form Templates**:
     1. *Savings / Current Account Opening Application*
     2. *NEFT / RTGS / IMPS Funds Transfer Pay-in Slip*
     3. *Cheque Book & Debit Card Request Form*
     4. *Periodic Re-KYC / Customer Profile Attestation*
     5. *Term / Fixed Deposit (FD) Creation Form*
     6. *External Netbanking Portal Simulator*
   - **Visual Auto-Fill Highlighting**: Smooth animated transitions highlighting fields as they are populated.
   - **Print & PDF Export**: Professional print stylesheet (`print.css`) that formats active forms as official paper bank slips complete with bank seals, branch stamps, and signature blocks.
   - **Universal Autofill Bookmarklet**: Includes a generated JavaScript snippet to auto-fill forms on external third-party web portals.

4. **Multiple Capture Modes & Testing Gallery**:
   - Drag-and-drop file upload (PNG, JPG, WEBP).
   - Built-in webcam viewfinder for live camera capture.
   - Pre-loaded Sample Passbooks for 5 major banks (SBI, HDFC, ICICI, PNB, Axis) with 1-click instant scanning.

---

## 🚀 Quick Start

### 1. Requirements
- Python 3.10+
- Windows 10/11 (with built-in Windows OCR)

### 2. Run the Application
Run the launcher:
```powershell
python run.py
```
Or with uvicorn directly:
```powershell
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

Open your browser to:
[http://127.0.0.1:8000](http://127.0.0.1:8000)

**Master Password:** `BankShield@2026` (or click *"⚡ Fill Demo Password"* on screen).
