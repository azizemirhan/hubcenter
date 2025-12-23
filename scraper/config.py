"""
Configuration module for the SiteGround Scraper Bot
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).parent / '.env'
load_dotenv(env_path)

# SiteGround Configuration
SITEGROUND_EMAIL = os.getenv('SITEGROUND_EMAIL', 'demirhanozdemir032@gmail.com')
SITEGROUND_PASSWORD = os.getenv('SITEGROUND_PASSWORD', '42c2d281.')
SITEGROUND_LOGIN_URL = 'https://login.siteground.com/'
SITEGROUND_RESELLER_URL = 'https://my.siteground.com/websites/list'

# CRM API Configuration
CRM_API_URL = os.getenv('CRM_API_URL', 'http://localhost:8000/api')
CRM_API_TOKEN = os.getenv('CRM_API_TOKEN', '')

# Browser Settings
HEADLESS = os.getenv('HEADLESS', 'false').lower() == 'true'
SLOW_MO = int(os.getenv('SLOW_MO', '100'))  # Milliseconds between actions

# Scraping Settings
REQUEST_DELAY = 2  # Seconds between requests to avoid rate limiting
TIMEOUT = 30000  # Page load timeout in milliseconds

# Contact page paths to try
CONTACT_PAGE_PATHS = [
    '/iletisim',
    '/contact',
    '/contact-us',
    '/iletisim.html',
    '/contact.html',
    '/bize-ulasin',
    '/bize-ulasin.html',
]

# About page paths to try
ABOUT_PAGE_PATHS = [
    '/hakkimizda',
    '/about',
    '/about-us',
    '/hakkimizda.html',
    '/about.html',
    '/kurumsal',
    '/kurumsal.html',
]
