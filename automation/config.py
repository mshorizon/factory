import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Paths
BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
OUTPUT_DIR = BASE_DIR / "output"
TEMPLATES_DIR = BASE_DIR / "templates"
LEADS_CSV = DATA_DIR / "leads.csv"

# Database
DATABASE_URL = os.getenv("DATABASE_URL", "")

# API Keys
YELP_API_KEY = os.getenv("YELP_API_KEY", "")
FOURSQUARE_API_KEY = os.getenv("FOURSQUARE_API_KEY", "")

# Email
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SENDER_EMAIL = os.getenv("SENDER_EMAIL", "")
SENDER_NAME = os.getenv("SENDER_NAME", "")

# Preview
PREVIEW_BASE_URL = os.getenv("PREVIEW_BASE_URL", "https://preview.example.com")

# Rate limits
MAX_EMAILS_PER_DAY = 50
SCRAPER_DELAY_SECONDS = 2  # delay between web scraping requests
