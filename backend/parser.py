import re
from typing import Dict, Any, List

KNOWN_BANKS = [
    ("STATE BANK OF INDIA", ["STATE BANK OF INDIA", "STATE BANK", "SBI"]),
    ("HDFC BANK", ["HDFC BANK LIMITED", "HDFC BANK", "HDFC"]),
    ("ICICI BANK", ["ICICI BANK LIMITED", "ICICI BANK", "ICICI"]),
    ("PUNJAB NATIONAL BANK", ["PUNJAB NATIONAL BANK", "PNB"]),
    ("AXIS BANK", ["AXIS BANK LIMITED", "AXIS BANK", "AXIS"]),
    ("BANK OF BARODA", ["BANK OF BARODA", "BARODA", "BOB"]),
    ("CANARA BANK", ["CANARA BANK", "CANARA"]),
    ("UNION BANK OF INDIA", ["UNION BANK OF INDIA", "UNION BANK"]),
    ("KOTAK MAHINDRA BANK", ["KOTAK MAHINDRA BANK", "KOTAK"]),
    ("INDUSIND BANK", ["INDUSIND BANK", "INDUSIND"]),
    ("BANK OF INDIA", ["BANK OF INDIA", "BOI"]),
    ("CENTRAL BANK OF INDIA", ["CENTRAL BANK OF INDIA"]),
    ("IDBI BANK", ["IDBI BANK"]),
    ("INDIAN BANK", ["INDIAN BANK"]),
    ("YES BANK", ["YES BANK"]),
    ("FEDERAL BANK", ["FEDERAL BANK"])
]

IFSC_PREFIX_MAP = {
    "SBIN": "STATE BANK OF INDIA",
    "HDFC": "HDFC BANK",
    "ICIC": "ICICI BANK",
    "PUNB": "PUNJAB NATIONAL BANK",
    "UTIB": "AXIS BANK",
    "BARB": "BANK OF BARODA",
    "CNRB": "CANARA BANK",
    "UBIN": "UNION BANK OF INDIA",
    "KKBK": "KOTAK MAHINDRA BANK",
    "INDB": "INDUSIND BANK",
    "BKID": "BANK OF INDIA",
    "CBIN": "CENTRAL BANK OF INDIA",
    "IBKL": "IDBI BANK",
    "IDIB": "INDIAN BANK",
    "YESB": "YES BANK",
    "FDRL": "FEDERAL BANK",
    "IOBA": "INDIAN OVERSEAS BANK",
    "MAHB": "BANK OF MAHARASHTRA"
}

def clean_ocr_text(text: str) -> str:
    """Clean common OCR artifacts while preserving banking characters."""
    text = text.replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"')
    text = re.sub(r"SOL\s*['\"]?[D|IO]\b", "SOL ID", text, flags=re.IGNORECASE)
    text = re.sub(r"CUSTOMER\s*ID\s*1\s*CIF", "CUSTOMER ID / CIF", text, flags=re.IGNORECASE)
    text = re.sub(r"RELATION\s*1\s*CARE", "RELATION / CARE", text, flags=re.IGNORECASE)
    return text

def parse_bank_details(raw_text: str, lines: List[str] = None) -> Dict[str, Any]:
    if lines is None:
        lines = [l.strip() for l in raw_text.splitlines() if l.strip()]
    else:
        lines = [l.strip() for l in lines if l.strip()]

    full_text = " \n ".join(lines)
    cleaned_full = clean_ocr_text(full_text)

    details = {
        "bank_name": "",
        "account_holder": "",
        "account_number": "",
        "ifsc_code": "",
        "cif_number": "",
        "micr_code": "",
        "branch_name": "",
        "branch_code": "",
        "account_type": "SAVINGS ACCOUNT",
        "mobile": "",
        "email": "",
        "address": "",
        "issue_date": "",
        "confidence_scores": {},
        "raw_text": raw_text
    }

    # 1. IFSC Code detection (Format: 4 letters, 0, 6 letters/digits)
    ifsc_match = re.search(r'\b([A-Z]{4})([0O])([A-Z0-9]{6})\b', cleaned_full, re.IGNORECASE)
    if ifsc_match:
        normalized_ifsc = (ifsc_match.group(1) + "0" + ifsc_match.group(3)).upper()
        details["ifsc_code"] = normalized_ifsc
        details["confidence_scores"]["ifsc_code"] = 0.99
        prefix = normalized_ifsc[:4]
        if prefix in IFSC_PREFIX_MAP:
            details["bank_name"] = IFSC_PREFIX_MAP[prefix]
            details["confidence_scores"]["bank_name"] = 0.99

    # If bank name wasn't detected from IFSC, match from known bank names
    if not details["bank_name"]:
        for canonical_name, aliases in KNOWN_BANKS:
            for alias in aliases:
                if re.search(r'\b' + re.escape(alias) + r'\b', cleaned_full, re.IGNORECASE):
                    details["bank_name"] = canonical_name
                    details["confidence_scores"]["bank_name"] = 0.95
                    break
            if details["bank_name"]:
                break

    # 2. Account Holder Name
    # Check for ACCOUNT HOLDER: [NAME] followed by either end of line or right-column marker
    for line in lines:
        cleaned_line = clean_ocr_text(line)
        holder_m = re.search(r'ACCOUNT\s*HOLDER[:\s\-]+([A-Z\s\.]+?)(?:\s*(?:CUSTOMER|CIF|ACCOUNT\s*NO|RELATION|SOL|IFSC|MICR|TYPE|MOBILE|REGISTERED|$))', cleaned_line, re.IGNORECASE)
        if holder_m:
            val = holder_m.group(1).strip()
            # Clean up trailing artifacts
            val = re.sub(r'[^A-Z\s\.]', '', val).strip()
            if len(val) >= 3 and not re.search(r'(BANK|LIMITED|BRANCH|NUMBER|OFFICIAL|AUTHORISED)', val, re.IGNORECASE):
                details["account_holder"] = val
                details["confidence_scores"]["account_holder"] = 0.98
                break

    # If still not found, check line following "ACCOUNT HOLDER:"
    if not details["account_holder"]:
        for i, line in enumerate(lines):
            if re.match(r'^ACCOUNT\s*HOLDER[:\s\-]*$', line.strip(), re.IGNORECASE):
                for j in range(i + 1, min(i + 4, len(lines))):
                    cand = lines[j].strip()
                    if re.match(r'^[A-Z\s\.]{3,30}$', cand) and not re.search(r'(BANK|LIMITED|BRANCH|ACCOUNT|NUMBER|IFSC|CIF|TYPE|RELATION)', cand, re.IGNORECASE):
                        details["account_holder"] = cand
                        details["confidence_scores"]["account_holder"] = 0.90
                        break
                if details["account_holder"]:
                    break

    # 3. Customer ID / CIF Number
    cif_match = re.search(r'(?:CUSTOMER\s*ID\s*[\/\\]*\s*CIF|CIF|CUSTOMER\s*ID|CRN|CUST\s*ID)[:\s\-]*([0-9]{7,14})\b', cleaned_full, re.IGNORECASE)
    if cif_match:
        details["cif_number"] = cif_match.group(1)
        details["confidence_scores"]["cif_number"] = 0.98
    else:
        # Check alphanumeric CIF if digits didn't match
        cif_m2 = re.search(r'(?:CIF|CUSTOMER\s*ID)[:\s\-]*([A-Z0-9]{7,14})\b', cleaned_full, re.IGNORECASE)
        if cif_m2 and not re.match(r'^[A-Z]+$', cif_m2.group(1)):
            details["cif_number"] = cif_m2.group(1)
            details["confidence_scores"]["cif_number"] = 0.90

    # 4. Account Number
    acct_match = re.search(r'(?:ACCOUNT\s*NUMBER|ACCOUNT\s*NO|A\/C\s*NO|ACC\s*NO|A\/C\s*NUM|ACCOUNT\s*#)[:\s\-]*(\d{9,18})\b', cleaned_full, re.IGNORECASE)
    if acct_match:
        details["account_number"] = acct_match.group(1)
        details["confidence_scores"]["account_number"] = 0.98
    else:
        for line in lines:
            if re.search(r'ACCOUNT\s*(?:NUMBER|NO)', line, re.IGNORECASE):
                nums = re.findall(r'\b(\d{9,18})\b', line)
                if nums:
                    details["account_number"] = nums[0]
                    details["confidence_scores"]["account_number"] = 0.92
                    break

    # Fallback to standalone large digit string
    if not details["account_number"]:
        candidates = re.findall(r'\b(\d{11,18})\b', cleaned_full)
        for c in candidates:
            if c != details.get("cif_number") and c != details.get("mobile"):
                details["account_number"] = c
                details["confidence_scores"]["account_number"] = 0.80
                break

    # 5. MICR Code (9 digits)
    micr_match = re.search(r'(?:MICR|MICR\s*CODE)[:\s\-]*(\d{9})\b', cleaned_full, re.IGNORECASE)
    if micr_match:
        details["micr_code"] = micr_match.group(1)
        details["confidence_scores"]["micr_code"] = 0.98
    else:
        # 9-digit standalone
        m_cands = re.findall(r'\b(\d{9})\b', cleaned_full)
        for c in m_cands:
            if c != details.get("cif_number") and c != details.get("account_number"):
                details["micr_code"] = c
                details["confidence_scores"]["micr_code"] = 0.85
                break

    # 6. Branch Name & Code
    for line in lines:
        cleaned_line = clean_ocr_text(line)
        if "IMMEDIATELY" in cleaned_line.upper():
            continue
        bm = re.search(r'BRANCH[:\s\-]+(.*?)(?:\s*(?:[\|I]\s*SOL\s*ID|BRANCH\s*CODE|IFSC|$))', cleaned_line, re.IGNORECASE)
        if bm:
            b_text = bm.group(1).strip().strip("|,;:-")
            if len(b_text) > 3:
                details["branch_name"] = b_text
                details["confidence_scores"]["branch_name"] = 0.95
                break

    code_match = re.search(r'(?:SOL\s*ID|BRANCH\s*CODE|BR\s*CODE)[:\s\-]*([A-Z0-9]{3,8})\b', cleaned_full, re.IGNORECASE)
    if code_match:
        details["branch_code"] = code_match.group(1).strip()
        details["confidence_scores"]["branch_code"] = 0.95

    # 7. Account Type
    if re.search(r'\b(?:SALARY|REGULAR\s*SALARY)\b', cleaned_full, re.IGNORECASE):
        details["account_type"] = "SALARY ACCOUNT"
    elif re.search(r'\b(?:CURRENT|CA\b|CURRENT\s*A\/C)', cleaned_full, re.IGNORECASE):
        details["account_type"] = "CURRENT ACCOUNT"
    elif re.search(r'\b(?:RECURRING|RD\b)', cleaned_full, re.IGNORECASE):
        details["account_type"] = "RECURRING DEPOSIT"
    elif re.search(r'\b(?:FIXED|FD\b)', cleaned_full, re.IGNORECASE):
        details["account_type"] = "FIXED DEPOSIT"
    elif re.search(r'\b(?:ADVANTAGE\s*SAVINGS|PRUDENT\s*SAVINGS|LIBERTY\s*SAVINGS|SAVINGS|SAVING|SB\b)', cleaned_full, re.IGNORECASE):
        details["account_type"] = "SAVINGS ACCOUNT"

    # 8. Mobile Number (specifically labeled with MOBILE/PHONE or 10-digit starting 6-9)
    mob_match = re.search(r'(?:MOBILE\s*NUMBER|MOBILE|PHONE|MOB|TEL)[:\s\-]*(\+?91[\-\s]?)?([6-9]\d{9})\b', cleaned_full, re.IGNORECASE)
    if mob_match:
        details["mobile"] = mob_match.group(2)
        details["confidence_scores"]["mobile"] = 0.98
    else:
        # Fallback to standalone 10-digit starting 6-9 that isn't cif or acct
        mobs = re.findall(r'\b([6-9]\d{9})\b', cleaned_full)
        for m in mobs:
            if m != details.get("cif_number") and m != details.get("account_number"):
                details["mobile"] = m
                details["confidence_scores"]["mobile"] = 0.85
                break

    # 9. Email Address
    email_match = re.search(r'\b([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)\b', cleaned_full)
    if email_match:
        clean_email = email_match.group(1).lower().replace(" ", "").replace("_", ".")
        details["email"] = clean_email
        details["confidence_scores"]["email"] = 0.98

    # 10. Date of Issue
    date_match = re.search(r'(?:DATE\s*OF\s*ISSUE|ISSUE\s*DATE|DATE\s*OF\s*OPENING|A\/C\s*OPEN\s*DATE|DATE)[:\s\-]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b', cleaned_full, re.IGNORECASE)
    if date_match:
        details["issue_date"] = date_match.group(1)
        details["confidence_scores"]["issue_date"] = 0.95
    else:
        dates = re.findall(r'\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})\b', cleaned_full)
        if dates:
            details["issue_date"] = dates[0]
            details["confidence_scores"]["issue_date"] = 0.85

    # 11. Address
    # Clean extraction for registered address
    addr_parts = []
    for line in lines:
        if re.search(r'(?:REGISTERED\s*ADDRESS|ROAD|STREET|NAGAR|SECTOR|BLOCK|FLAT|ENCLAVE|AVENUE|APTS|APARTMENTS|LANE|COLONY|DELHI|MUMBAI|BENGALURU|CHENNAI|KOLKATA|HYDERABAD|PUNE|CHANDIGARH|\b\d{6}\b)', line, re.IGNORECASE):
            if not line.startswith("BRANCH:") and not "IMMEDIATELY" in line.upper() and not any(b[0] in line for b in KNOWN_BANKS):
                cleaned_line = re.sub(r'REGISTERED\s*ADDRESS[:\s\-]*', '', line, flags=re.IGNORECASE)
                cleaned_line = re.sub(r'(?:OFFICIAL|AUTHORISED|SIGNATURE|COMPUTER).*', '', cleaned_line, flags=re.IGNORECASE).strip()
                if cleaned_line:
                    addr_parts.append(cleaned_line)
    
    if addr_parts:
        raw_addr = ", ".join(addr_parts)
        # Normalize double commas and spaces
        cleaned_addr = re.sub(r',\s*,+', ',', raw_addr)
        details["address"] = re.sub(r'\s+', ' ', cleaned_addr).strip(' ,')
        details["confidence_scores"]["address"] = 0.92

    return details
