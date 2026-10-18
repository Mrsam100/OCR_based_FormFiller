import os
import sys
import webbrowser
import uvicorn
from backend.sample_generator import generate_all_samples

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    samples_dir = os.path.join(base_dir, "static", "samples")
    
    print("=" * 65)
    print("  AutoBankFill - Bank Passbook OCR & Automated Form Filling System")
    print("=" * 65)
    print(f"[*] Ensuring sample bank passbooks are initialized in {samples_dir}...")
    generate_all_samples(samples_dir)
    print("[✓] Ready.")
    
    port = int(os.environ.get("PORT", 8000))
    host = "127.0.0.1"
    url = f"http://{host}:{port}"
    
    print("-" * 65)
    print(f"[*] Web Server URL:   {url}")
    print("[*] Access Mode:      Direct / Open (No Password Required)")
    print("[*] Native OCR Engine: Windows Media OCR + OpenCV Preprocessing")
    print("-" * 65)
    
    # Try opening default browser
    try:
        webbrowser.open(url)
    except Exception:
        pass
        
    uvicorn.run("backend.main:app", host=host, port=port, log_level="info", reload=False)

if __name__ == "__main__":
    main()
