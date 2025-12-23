# SiteGround Scraper Bot

Python bot that scrapes SiteGround hosting data and customer website contact information.

## Setup

```bash
cd /home/aziz/next-crm-ozel/crm_erp/scraper

# Create virtual environment (optional)
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Install Playwright browsers
playwright install chromium

# Create .env file from example
cp .env.example .env
# Edit .env with your credentials
```

## Configuration

Edit `.env` file:

```env
SITEGROUND_EMAIL=your-siteground-email@example.com
SITEGROUND_PASSWORD=your-siteground-password
CRM_API_URL=http://localhost:8000/api
CRM_API_TOKEN=your-api-token
HEADLESS=false
```

## Usage

```bash
# Test SiteGround login
python main.py --test-login

# Full scrape (SiteGround + websites + CRM update)
python main.py

# Scrape SiteGround only (no website contact scraping)
python main.py --siteground-only

# Dry run (scrape but don't update CRM)
python main.py --dry-run

# Get detailed info from Site Tools for each site
python main.py --details

# Limit number of sites to process
python main.py --limit 5

# Custom output file
python main.py --output my_results.json
```

## Output

Results are saved to `scrape_results_YYYYMMDD_HHMMSS.json` containing:

- `siteground_sites`: List of all hosting info from SiteGround
- `website_data`: Scraped contact info from each website
- `crm_updates`: Status of CRM updates
- `errors`: Any errors encountered

## Individual Module Usage

```bash
# Test SiteGround scraper only
python siteground_scraper.py --test-login

# Test website scraper on a single domain
python website_scraper.py example.com

# Test CRM connection
python crm_client.py
```
