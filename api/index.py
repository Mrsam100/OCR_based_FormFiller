import os
import sys

# Ensure backend modules can be imported in Vercel serverless environment
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if base_dir not in sys.path:
    sys.path.insert(0, base_dir)

from backend.main import app
