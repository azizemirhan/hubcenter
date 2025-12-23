"""
Website Contact Information Scraper

This module scrapes contact information from customer websites including:
- Phone numbers
- Email addresses  
- Physical addresses
- Social media links
- Company information
"""
import re
import time
from typing import Dict, Any, List, Optional
from urllib.parse import urljoin, urlparse
from playwright.sync_api import sync_playwright, Page, Browser

from config import (
    CONTACT_PAGE_PATHS,
    ABOUT_PAGE_PATHS,
    HEADLESS,
    SLOW_MO,
    TIMEOUT,
    REQUEST_DELAY,
)


class WebsiteScraper:
    """Scraper for extracting contact info from websites"""
    
    # Regex patterns for extracting information
    PHONE_PATTERNS = [
        r'(?:\+90\s?)?(?:\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}',  # Turkish format
        r'(?:\+90\s?)?5\d{2}[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}',  # Turkish mobile
        r'\d{4}[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}',  # Generic
        r'\(\d{3}\)\s?\d{3}[\s.-]?\d{4}',  # US format
    ]
    
    EMAIL_PATTERN = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    
    def __init__(self, use_existing_browser: bool = False, page: Page = None):
        self.playwright = None
        self.browser: Optional[Browser] = None
        self.page: Optional[Page] = page
        self.use_existing_browser = use_existing_browser
    
    def start_browser(self):
        """Initialize browser if not using existing one"""
        if self.use_existing_browser and self.page:
            return
            
        print("🚀 Website scraper başlatılıyor...")
        self.playwright = sync_playwright().start()
        self.browser = self.playwright.chromium.launch(
            headless=HEADLESS,
            slow_mo=SLOW_MO,
        )
        
        # Use a realistic browser context to avoid bot detection
        context = self.browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            locale='tr-TR',
            timezone_id='Europe/Istanbul',
            extra_http_headers={
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
                'Accept-Encoding': 'gzip, deflate, br',
                'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"Windows"',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1',
            }
        )
        self.page = context.new_page()
        self.page.set_default_timeout(TIMEOUT)
    
    def close_browser(self):
        """Close browser if we own it"""
        if self.use_existing_browser:
            return
            
        if self.browser:
            self.browser.close()
        if self.playwright:
            self.playwright.stop()
    
    def _normalize_url(self, domain: str) -> str:
        """Ensure domain has proper URL format"""
        if not domain.startswith(('http://', 'https://')):
            return f'https://{domain}'
        return domain
    
    def _extract_phones(self, text: str) -> List[str]:
        """Extract phone numbers from text"""
        phones = []
        for pattern in self.PHONE_PATTERNS:
            matches = re.findall(pattern, text)
            for match in matches:
                # Clean up the phone number
                cleaned = re.sub(r'[^\d+]', '', match)
                if len(cleaned) >= 10 and cleaned not in phones:
                    phones.append(cleaned)
        return phones[:5]  # Limit to 5 numbers
    
    def _extract_emails(self, text: str) -> List[str]:
        """Extract email addresses from text"""
        # Also check HTML for mailto links
        emails = re.findall(self.EMAIL_PATTERN, text.lower())
        # Filter out common non-personal emails and duplicates
        filtered = []
        excluded_patterns = ['example.com', 'domain.com', 'email.com', 'yoursite']
        for email in emails:
            if not any(ex in email for ex in excluded_patterns):
                if email not in filtered:
                    filtered.append(email)
        return filtered[:5]
    
    def _extract_address(self, text: str) -> str:
        """Try to extract physical address from text"""
        # Look for common Turkish address patterns
        address_patterns = [
            r'(?:Adres|Address)[:\s]*([^\n]{20,150})',
            r'(?:Merkez|Ofis|Şube)[:\s]*([^\n]{20,150})',
            r'(\d+\.?\s*(?:Sokak|Cadde|Mah\.|Mahallesi)[^\n]{10,100})',
        ]
        
        for pattern in address_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        return ''
    
    def _extract_social_media(self, html: str) -> Dict[str, str]:
        """Extract social media links from page HTML"""
        social = {
            'facebook': '',
            'instagram': '',
            'twitter': '',
            'linkedin': '',
            'youtube': '',
        }
        
        patterns = {
            'facebook': r'href=["\']?(https?://(?:www\.)?facebook\.com/[^"\'\s>]+)',
            'instagram': r'href=["\']?(https?://(?:www\.)?instagram\.com/[^"\'\s>]+)',
            'twitter': r'href=["\']?(https?://(?:www\.)?(?:twitter|x)\.com/[^"\'\s>]+)',
            'linkedin': r'href=["\']?(https?://(?:www\.)?linkedin\.com/[^"\'\s>]+)',
            'youtube': r'href=["\']?(https?://(?:www\.)?youtube\.com/[^"\'\s>]+)',
        }
        
        for platform, pattern in patterns.items():
            match = re.search(pattern, html, re.IGNORECASE)
            if match:
                social[platform] = match.group(1)
        
        return social
    
    def _find_contact_page(self, base_url: str) -> Optional[str]:
        """Try to find contact page URL"""
        for path in CONTACT_PAGE_PATHS:
            url = urljoin(base_url, path)
            try:
                response = self.page.goto(url, wait_until='domcontentloaded')
                if response and response.status == 200:
                    return url
            except:
                continue
        return None
    
    def _find_about_page(self, base_url: str) -> Optional[str]:
        """Try to find about page URL"""
        for path in ABOUT_PAGE_PATHS:
            url = urljoin(base_url, path)
            try:
                response = self.page.goto(url, wait_until='domcontentloaded')
                if response and response.status == 200:
                    return url
            except:
                continue
        return None
    
    def scrape_website(self, domain: str) -> Dict[str, Any]:
        """
        Scrape contact information from a website
        
        Returns a dictionary with:
        - phones: list of phone numbers
        - emails: list of email addresses
        - address: physical address if found
        - social: dict of social media links
        - company_name: extracted company name if found
        - description: meta description or about text
        """
        print(f"🔍 {domain} taraniyor...")
        
        result = {
            'domain': domain,
            'phones': [],
            'emails': [],
            'address': '',
            'social': {},
            'company_name': '',
            'description': '',
            'scraped': False,
            'error': None,
        }
        
        base_url = self._normalize_url(domain)
        
        try:
            # First, visit the homepage
            print(f"   📄 Ana sayfa yükleniyor...")
            
            # Try HTTPS first, then with www, then HTTP
            urls_to_try = [
                base_url,
                f'https://www.{domain}' if not domain.startswith('www.') else base_url,
                f'http://{domain}',
            ]
            
            response = None
            for url in urls_to_try:
                try:
                    # Wait for networkidle to handle Cloudflare challenges
                    response = self.page.goto(url, wait_until='networkidle', timeout=20000)
                    if response and response.status < 400:
                        base_url = url  # Update base URL for subsequent requests
                        break
                    elif response and response.status == 403:
                        # Maybe Cloudflare challenge, wait and check
                        time.sleep(3)
                        # Check if page loaded after challenge
                        current_url = self.page.url
                        if 'challenge' not in current_url and 'captcha' not in current_url:
                            page_text = self.page.inner_text('body')
                            if len(page_text) > 100:  # Real content loaded
                                response = type('Response', (), {'status': 200})()
                                break
                except Exception:
                    continue
            
            if not response or response.status >= 400:
                result['error'] = f"HTTP {response.status if response else 'No response'}"
                print(f"   ❌ Site erişilemez: {result['error']}")
                return result
            
            time.sleep(2)
            
            # Get homepage content
            homepage_html = self.page.content()
            homepage_text = self.page.inner_text('body')
            
            # Extract from homepage
            result['emails'].extend(self._extract_emails(homepage_text))
            result['phones'].extend(self._extract_phones(homepage_text))
            result['social'] = self._extract_social_media(homepage_html)
            
            # Try to get meta description
            meta_desc = self.page.query_selector('meta[name="description"]')
            if meta_desc:
                result['description'] = meta_desc.get_attribute('content') or ''
            
            # Try to get company name from title or header
            title = self.page.title()
            if title:
                # Clean up title - often format is "Company Name | Tagline"
                result['company_name'] = title.split('|')[0].split('-')[0].strip()
            
            # Try contact page
            print(f"   📞 İletişim sayfası aranıyor...")
            contact_url = self._find_contact_page(base_url)
            if contact_url:
                time.sleep(1)
                contact_text = self.page.inner_text('body')
                
                # Extract additional info from contact page
                new_emails = self._extract_emails(contact_text)
                new_phones = self._extract_phones(contact_text)
                
                for email in new_emails:
                    if email not in result['emails']:
                        result['emails'].append(email)
                
                for phone in new_phones:
                    if phone not in result['phones']:
                        result['phones'].append(phone)
                
                # Try to extract address
                if not result['address']:
                    result['address'] = self._extract_address(contact_text)
            
            # Try about page
            print(f"   ℹ️ Hakkımızda sayfası aranıyor...")
            about_url = self._find_about_page(base_url)
            if about_url:
                time.sleep(1)
                about_text = self.page.inner_text('body')
                
                # Get company description from about page if not from meta
                if not result['description'] or len(result['description']) < 50:
                    # Take first paragraph-like content
                    paragraphs = about_text.split('\n')
                    for p in paragraphs:
                        if len(p) > 50 and len(p) < 500:
                            result['description'] = p.strip()
                            break
            
            result['scraped'] = True
            
            # Summary
            print(f"   ✅ Tamamlandı:")
            print(f"      📧 {len(result['emails'])} email")
            print(f"      📱 {len(result['phones'])} telefon")
            if result['address']:
                print(f"      📍 Adres bulundu")
            
        except Exception as e:
            result['error'] = str(e)
            print(f"   ❌ Hata: {str(e)[:100]}")
        
        time.sleep(REQUEST_DELAY)
        return result
    
    def scrape_multiple(self, domains: List[str]) -> List[Dict[str, Any]]:
        """Scrape multiple websites"""
        results = []
        
        try:
            self.start_browser()
            
            for i, domain in enumerate(domains):
                print(f"\n[{i+1}/{len(domains)}]")
                result = self.scrape_website(domain)
                results.append(result)
        
        finally:
            self.close_browser()
        
        return results


def main():
    """Test the website scraper"""
    import sys
    
    if len(sys.argv) < 2:
        print("Kullanım: python website_scraper.py <domain>")
        print("Örnek: python website_scraper.py example.com")
        return
    
    domain = sys.argv[1]
    
    scraper = WebsiteScraper()
    try:
        scraper.start_browser()
        result = scraper.scrape_website(domain)
        
        print("\n" + "="*50)
        print("SONUÇ")
        print("="*50)
        print(f"Domain: {result['domain']}")
        print(f"Şirket: {result['company_name']}")
        print(f"Emailler: {', '.join(result['emails']) or 'Bulunamadı'}")
        print(f"Telefonlar: {', '.join(result['phones']) or 'Bulunamadı'}")
        print(f"Adres: {result['address'] or 'Bulunamadı'}")
        print(f"Açıklama: {result['description'][:100]}..." if result['description'] else "")
        print(f"Sosyal Medya:")
        for platform, url in result['social'].items():
            if url:
                print(f"  - {platform}: {url}")
        
    finally:
        scraper.close_browser()


if __name__ == '__main__':
    main()
