import os
from PIL import Image, ImageDraw, ImageFont

SAMPLE_PROFILES = [
    {
        "id": "sbi",
        "bank_name": "STATE BANK OF INDIA",
        "branch_name": "CONNAUGHT PLACE BRANCH, NEW DELHI",
        "branch_code": "000691",
        "account_holder": "RAHUL SHARMA",
        "relation": "S/O SURESH SHARMA",
        "account_number": "31984572019",
        "cif_number": "87654321098",
        "ifsc_code": "SBIN0000691",
        "micr_code": "110002015",
        "account_type": "SAVINGS BANK A/C",
        "mobile": "9876543210",
        "email": "rahul.sharma@email.com",
        "address": "42, BARAKHAMBA ROAD, CONNAUGHT PLACE, NEW DELHI - 110001",
        "issue_date": "15/03/2023",
        "color": (24, 76, 120),  # SBI Blue
        "accent": (230, 240, 250)
    },
    {
        "id": "hdfc",
        "bank_name": "HDFC BANK LIMITED",
        "branch_name": "KORAMANGALA 5TH BLOCK, BENGALURU",
        "branch_code": "000142",
        "account_holder": "PRIYA VENKATESH",
        "relation": "D/O R. VENKATESH",
        "account_number": "50100234918234",
        "cif_number": "92837416",
        "ifsc_code": "HDFC0000142",
        "micr_code": "560240008",
        "account_type": "REGULAR SALARY ACCOUNT",
        "mobile": "9845012345",
        "email": "priya.venkatesh@email.com",
        "address": "FLAT 302, GREENWOOD APTS, 80FT ROAD, BENGALURU - 560034",
        "issue_date": "22/07/2022",
        "color": (0, 76, 143),  # HDFC Navy
        "accent": (235, 242, 250)
    },
    {
        "id": "icici",
        "bank_name": "ICICI BANK LIMITED",
        "branch_name": "BANDRA KURLA COMPLEX (BKC), MUMBAI",
        "branch_code": "000456",
        "account_holder": "AMITABH DESHMUKH",
        "relation": "S/O VILAS DESHMUKH",
        "account_number": "000401569823",
        "cif_number": "54628193",
        "ifsc_code": "ICIC0000004",
        "micr_code": "400229002",
        "account_type": "ADVANTAGE SAVINGS ACCOUNT",
        "mobile": "9820198201",
        "email": "amitabh.d@email.com",
        "address": "12A TOWER B, SEA VIEW ENCLAVE, WORLI, MUMBAI - 400018",
        "issue_date": "09/11/2021",
        "color": (165, 30, 36),  # ICICI Maroon
        "accent": (253, 242, 242)
    },
    {
        "id": "pnb",
        "bank_name": "PUNJAB NATIONAL BANK",
        "branch_name": "SECTOR 17, CHANDIGARH",
        "branch_code": "017200",
        "account_holder": "GURPREET SINGH",
        "relation": "S/O HARJINDER SINGH",
        "account_number": "0172000100293847",
        "cif_number": "782910482",
        "ifsc_code": "PUNB0017200",
        "micr_code": "160024003",
        "account_type": "PNB PRUDENT SAVINGS A/C",
        "mobile": "9814098140",
        "email": "gurpreet.singh@email.com",
        "address": "HOUSE 148, SECTOR 18-B, CHANDIGARH - 160018",
        "issue_date": "04/01/2024",
        "color": (153, 0, 51),  # PNB Red
        "accent": (250, 240, 243)
    },
    {
        "id": "axis",
        "bank_name": "AXIS BANK LIMITED",
        "branch_name": "SOMAJIGUDA, HYDERABAD",
        "branch_code": "000028",
        "account_holder": "SNEHA REDDY",
        "relation": "W/O K. VIKRAM REDDY",
        "account_number": "918010045612345",
        "cif_number": "639201847",
        "ifsc_code": "UTIB0000028",
        "micr_code": "500211002",
        "account_type": "LIBERTY SAVINGS ACCOUNT",
        "mobile": "9989012345",
        "email": "sneha.reddy@email.com",
        "address": "PLOT 88, JUBILEE HILLS, ROAD NO 36, HYDERABAD - 500033",
        "issue_date": "18/06/2023",
        "color": (134, 0, 56),  # Axis Burgundy
        "accent": (250, 238, 244)
    }
]

def generate_passbook_image(profile: dict, output_path: str):
    width, height = 900, 560
    img = Image.new("RGB", (width, height), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)

    # Outer border
    draw.rectangle([10, 10, width - 10, height - 10], outline=(180, 180, 180), width=2)
    draw.rectangle([14, 14, width - 14, height - 14], outline=(220, 220, 220), width=1)

    # Header background bar
    banner_height = 80
    draw.rectangle([14, 14, width - 14, 14 + banner_height], fill=profile["color"])

    # Header text
    try:
        font_title = ImageFont.truetype("arialbd.ttf", 26)
        font_subtitle = ImageFont.truetype("arial.ttf", 14)
        font_label = ImageFont.truetype("arialbd.ttf", 14)
        font_val = ImageFont.truetype("arial.ttf", 15)
        font_mono = ImageFont.truetype("courbd.ttf", 16)
        font_small = ImageFont.truetype("arial.ttf", 11)
    except Exception:
        font_title = ImageFont.load_default()
        font_subtitle = ImageFont.load_default()
        font_label = ImageFont.load_default()
        font_val = ImageFont.load_default()
        font_mono = ImageFont.load_default()
        font_small = ImageFont.load_default()

    # Draw bank title
    draw.text((30, 24), profile["bank_name"], fill=(255, 255, 255), font=font_title)
    draw.text((32, 58), f"BRANCH: {profile['branch_name']} | SOL ID: {profile['branch_code']}", fill=(240, 240, 240), font=font_subtitle)

    # Watermark background tint
    draw.rectangle([20, 105, width - 20, height - 55], fill=profile.get("accent", (248, 250, 252)), outline=(220, 225, 230), width=1)

    # Section divider
    col1_x = 40
    col1_val_x = 220
    col2_x = 490
    col2_val_x = 640
    
    y = 120
    row_gap = 34

    # Row 1: Account Holder & Customer ID
    draw.text((col1_x, y), "ACCOUNT HOLDER:", fill=(40, 40, 40), font=font_label)
    draw.text((col1_val_x, y), profile["account_holder"], fill=(0, 0, 0), font=font_val)

    draw.text((col2_x, y), "CUSTOMER ID / CIF:", fill=(40, 40, 40), font=font_label)
    draw.text((col2_val_x, y), profile["cif_number"], fill=(0, 0, 0), font=font_mono)

    # Row 2: Relation & Account Number (Highlighted box)
    y += row_gap
    draw.text((col1_x, y), "RELATION / CARE OF:", fill=(40, 40, 40), font=font_label)
    draw.text((col1_val_x, y), profile["relation"], fill=(0, 0, 0), font=font_val)

    draw.text((col2_x, y), "ACCOUNT NUMBER:", fill=(40, 40, 40), font=font_label)
    # Highlight box for account number
    draw.rectangle([col2_val_x - 4, y - 2, col2_val_x + 230, y + 22], fill=(255, 255, 255), outline=profile["color"], width=1)
    draw.text((col2_val_x, y), profile["account_number"], fill=profile["color"], font=font_mono)

    # Row 3: Account Type & IFSC Code
    y += row_gap
    draw.text((col1_x, y), "ACCOUNT TYPE:", fill=(40, 40, 40), font=font_label)
    draw.text((col1_val_x, y), profile["account_type"], fill=(0, 0, 0), font=font_val)

    draw.text((col2_x, y), "IFSC CODE:", fill=(40, 40, 40), font=font_label)
    draw.rectangle([col2_val_x - 4, y - 2, col2_val_x + 180, y + 22], fill=(255, 255, 255), outline=(120, 120, 120), width=1)
    draw.text((col2_val_x, y), profile["ifsc_code"], fill=(0, 0, 0), font=font_mono)

    # Row 4: Mobile & MICR Code
    y += row_gap
    draw.text((col1_x, y), "MOBILE NUMBER:", fill=(40, 40, 40), font=font_label)
    draw.text((col1_val_x, y), profile["mobile"], fill=(0, 0, 0), font=font_val)

    draw.text((col2_x, y), "MICR CODE:", fill=(40, 40, 40), font=font_label)
    draw.text((col2_val_x, y), profile["micr_code"], fill=(0, 0, 0), font=font_mono)

    # Row 5: Email & Date of Issue
    y += row_gap
    draw.text((col1_x, y), "EMAIL ADDRESS:", fill=(40, 40, 40), font=font_label)
    draw.text((col1_val_x, y), profile["email"], fill=(0, 0, 0), font=font_val)

    draw.text((col2_x, y), "DATE OF ISSUE:", fill=(40, 40, 40), font=font_label)
    draw.text((col2_val_x, y), profile["issue_date"], fill=(0, 0, 0), font=font_val)

    # Row 6 & 7: Address (multiline)
    y += row_gap
    draw.text((col1_x, y), "REGISTERED ADDRESS:", fill=(40, 40, 40), font=font_label)
    # Split address if needed
    addr = profile["address"]
    if len(addr) > 42:
        draw.text((col1_val_x, y), addr[:42], fill=(0, 0, 0), font=font_val)
        y += 24
        draw.text((col1_val_x, y), addr[42:], fill=(0, 0, 0), font=font_val)
    else:
        draw.text((col1_val_x, y), addr, fill=(0, 0, 0), font=font_val)

    # Simulated Bank Seal Stamp & Signature box
    y = 390
    draw.rectangle([620, y, 840, y + 90], outline=(160, 160, 160), fill=(255, 255, 255), width=1)
    draw.text((645, y + 68), "AUTHORISED SIGNATURE", fill=(100, 100, 100), font=font_small)
    # Simulated signature scribble
    draw.line([(650, y + 45), (690, y + 25), (730, y + 50), (780, y + 30), (820, y + 42)], fill=(30, 60, 150), width=2)

    # Simulated circular bank seal stamp
    draw.ellipse([460, y - 10, 570, y + 100], outline=profile["color"], width=2)
    draw.text((475, y + 30), "OFFICIAL", fill=profile["color"], font=font_small)
    draw.text((485, y + 45), "SEAL", fill=profile["color"], font=font_small)

    # Bottom notice footer
    draw.rectangle([14, height - 42, width - 14, height - 14], fill=(245, 245, 245))
    draw.text((30, height - 35), "PLEASE NOTIFY ANY CHANGE OF ADDRESS TO THE BRANCH IMMEDIATELY | COMPUTER GENERATED PASSBOOK", fill=(110, 110, 110), font=font_small)

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    img.save(output_path, quality=95)
    return output_path

def generate_all_samples(samples_dir: str):
    os.makedirs(samples_dir, exist_ok=True)
    generated = []
    for profile in SAMPLE_PROFILES:
        filepath = os.path.join(samples_dir, f"{profile['id']}_passbook.png")
        generate_passbook_image(profile, filepath)
        generated.append({
            "id": profile["id"],
            "bank_name": profile["bank_name"],
            "account_holder": profile["account_holder"],
            "account_number": profile["account_number"],
            "filename": f"{profile['id']}_passbook.png",
            "full_path": filepath
        })
    return generated

if __name__ == "__main__":
    out_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static", "samples")
    results = generate_all_samples(out_dir)
    print(f"Generated {len(results)} sample passbook images in {out_dir}")
