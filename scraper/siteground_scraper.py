"""
SiteGround Reseller Panel Scraper

This module handles authentication and data extraction from SiteGround's
reseller panel, including website listings, hosting plans, disk usage, and SSL status.

Based on SiteGround's current UI structure (December 2024):
- Website list: my.siteground.com/websites/list
- Site Tools: tools.siteground.com/dashboard?siteId=XXX
"""
import time
import json
import re
from typing import Optional, List, Dict, Any
from playwright.sync_api import sync_playwright, Page, Browser, BrowserContext

from config import (
    SITEGROUND_EMAIL,
    SITEGROUND_PASSWORD,
    SITEGROUND_LOGIN_URL,
    HEADLESS,
    SLOW_MO,
    TIMEOUT,
    REQUEST_DELAY,
)


class SiteGroundScraper:
    """Scraper for SiteGround Reseller Panel"""
    
    # URLs
    WEBSITES_LIST_URL = 'https://my.siteground.com/websites/list'
    SITE_TOOLS_URL = 'https://tools.siteground.com/dashboard'
    
    def __init__(self):
        self.playwright = None
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None
        self.websites: List[Dict[str, Any]] = []
    
    def start_browser(self):
        """Initialize the browser"""
        print("🚀 Tarayıcı başlatılıyor...")
        self.playwright = sync_playwright().start()
        self.browser = self.playwright.chromium.launch(
            headless=HEADLESS,
            slow_mo=SLOW_MO,
        )
        self.context = self.browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        )
        self.page = self.context.new_page()
        self.page.set_default_timeout(TIMEOUT)
        print("✅ Tarayıcı hazır")
    
    def close_browser(self):
        """Close the browser and cleanup"""
        if self.context:
            self.context.close()
        if self.browser:
            self.browser.close()
        if self.playwright:
            self.playwright.stop()
        print("🔒 Tarayıcı kapatıldı")
    
    def login(self) -> bool:
        """
        Login to SiteGround
        Returns True if login was successful
        
        SiteGround uses a React SPA, so we need to wait for JavaScript to render
        """
        print("🔐 SiteGround'a giriş yapılıyor...")
        
        try:
            self.page.goto(SITEGROUND_LOGIN_URL)
            
            # Wait longer for React to render the form
            print("   ⏳ Sayfa yükleniyor (React SPA)...")
            time.sleep(5)
            
            # Try multiple selectors for email input
            email_selectors = [
                'input[type="email"]',
                'input[name="email"]', 
                'input[placeholder*="email" i]',
                'input[placeholder*="Email" i]',
                'input[autocomplete="email"]',
                '#email',
                'input[id*="email" i]',
            ]
            
            email_input = None
            for selector in email_selectors:
                try:
                    email_input = self.page.wait_for_selector(selector, timeout=3000)
                    if email_input:
                        print(f"   ✓ Email alanı bulundu: {selector}")
                        break
                except:
                    continue
            
            if not email_input:
                # Save debug page and ask user for manual login
                self._save_debug_page('login_page_debug.html')
                print("   ⚠️ Email alanı bulunamadı. Manuel giriş gerekebilir.")
                print("   📄 Debug sayfası 'login_page_debug.html' olarak kaydedildi")
                print("\n   👉 Lütfen tarayıcıda manuel olarak giriş yapın.")
                input("   Giriş yaptıktan sonra Enter'a basın...")
                
                # Check if logged in after manual login
                current_url = self.page.url
                if 'my.siteground.com' in current_url or 'dashboard' in current_url:
                    print("✅ Manuel giriş başarılı!")
                    return True
                return False
            
            # Fill email
            email_input.fill(SITEGROUND_EMAIL)
            print("   ✓ Email girildi")
            time.sleep(0.5)
            
            # Try multiple selectors for password input
            password_selectors = [
                'input[type="password"]',
                'input[name="password"]',
                'input[placeholder*="password" i]',
                'input[placeholder*="şifre" i]',
                '#password',
                'input[id*="password" i]',
            ]
            
            password_input = None
            for selector in password_selectors:
                try:
                    password_input = self.page.wait_for_selector(selector, timeout=3000)
                    if password_input:
                        print(f"   ✓ Şifre alanı bulundu: {selector}")
                        break
                except:
                    continue
            
            if password_input:
                password_input.fill(SITEGROUND_PASSWORD)
                print("   ✓ Şifre girildi")
            else:
                print("   ⚠️ Şifre alanı bulunamadı")
                return False
            
            time.sleep(0.5)
            
            # Try multiple selectors for login button
            button_selectors = [
                'button[type="submit"]',
                'input[type="submit"]',
                'button:has-text("Log In")',
                'button:has-text("Login")',
                'button:has-text("Giriş")',
                'button:has-text("Sign In")',
                '[class*="submit"]',
                '[class*="login-button"]',
            ]
            
            login_button = None
            for selector in button_selectors:
                try:
                    login_button = self.page.wait_for_selector(selector, timeout=2000)
                    if login_button:
                        print(f"   ✓ Giriş butonu bulundu: {selector}")
                        break
                except:
                    continue
            
            if login_button:
                login_button.click()
                print("   ✓ Giriş butonuna tıklandı")
            else:
                # Try pressing Enter on password field
                print("   ⚠️ Buton bulunamadı, Enter tuşuna basılıyor...")
                password_input.press("Enter")
            
            # Wait for navigation
            print("   ⏳ Giriş bekleniyor...")
            time.sleep(8)
            
            # Check if login was successful
            current_url = self.page.url
            if 'my.siteground.com' in current_url or 'tools.siteground.com' in current_url:
                print("✅ Giriş başarılı!")
                return True
            elif 'login' in current_url.lower():
                # Check for error messages
                error_elem = self.page.query_selector('[class*="error"], [class*="alert"], .error-message')
                if error_elem:
                    error_text = error_elem.inner_text()
                    print(f"   ❌ Giriş hatası: {error_text[:100]}")
                else:
                    print("   ❌ Giriş başarısız - bilgilerinizi kontrol edin veya captcha olabilir")
                    print("\n   👉 Lütfen tarayıcıda manuel olarak giriş yapın.")
                    input("   Giriş yaptıktan sonra Enter'a basın...")
                    
                    current_url = self.page.url
                    if 'my.siteground.com' in current_url or 'dashboard' in current_url:
                        print("✅ Manuel giriş başarılı!")
                        return True
                return False
            else:
                # Could be 2FA or other verification
                print("   ⚠️ Ek doğrulama gerekebilir, lütfen tarayıcıyı kontrol edin")
                input("   Devam etmek için Enter'a basın...")
                return True
                
        except Exception as e:
            print(f"❌ Giriş hatası: {str(e)}")
            print("\n   👉 Lütfen tarayıcıda manuel olarak giriş yapın.")
            input("   Giriş yaptıktan sonra Enter'a basın...")
            
            current_url = self.page.url
            if 'my.siteground.com' in current_url or 'dashboard' in current_url:
                print("✅ Manuel giriş başarılı!")
                return True
            return False
    
    def navigate_to_websites(self):
        """Navigate to the websites list page"""
        print("📋 Website listesine gidiliyor...")
        try:
            self.page.goto(self.WEBSITES_LIST_URL)
            time.sleep(3)
            
            # Wait for the table to load
            self.page.wait_for_selector('table, .websites-table, [class*="websites"]', timeout=10000)
            print("✅ Website listesi sayfası yüklendi")
        except Exception as e:
            print(f"❌ Sayfa yükleme hatası: {str(e)}")
    
    def get_websites_list(self) -> List[Dict[str, Any]]:
        """
        Extract the list of websites from SiteGround panel
        
        Based on the table structure:
        - Domain (link to site)
        - Plan (e.g., "Hosting Plan")
        - Site Created (date)
        - Status (e.g., "ACTIVE")
        - Actions (SITE TOOLS, WORDPRESS ADMIN buttons)
        """
        print("🔍 Website listesi çekiliyor...")
        websites = []
        
        try:
            # Wait for the table to be fully loaded
            time.sleep(2)
            
            # Find all table rows (skip header)
            # The table structure from screenshot shows domain links in first column
            rows = self.page.query_selector_all('table tbody tr, .websites-table tr:not(:first-child)')
            
            if not rows or len(rows) == 0:
                # Try alternative selectors
                rows = self.page.query_selector_all('[class*="website-row"], [class*="site-row"]')
            
            print(f"   📊 {len(rows)} satır bulundu")
            
            for row in rows:
                try:
                    website_data = {
                        'domain': '',
                        'plan': '',
                        'site_created': '',
                        'status': '',
                        'has_wordpress': False,
                        'site_tools_url': '',
                    }
                    
                    # Get all cells in the row
                    cells = row.query_selector_all('td')
                    
                    if len(cells) >= 4:
                        # First cell: Domain (contains link)
                        domain_cell = cells[0]
                        domain_link = domain_cell.query_selector('a')
                        if domain_link:
                            website_data['domain'] = domain_link.inner_text().strip()
                        else:
                            website_data['domain'] = domain_cell.inner_text().strip()
                        
                        # Second cell: Plan
                        website_data['plan'] = cells[1].inner_text().strip()
                        
                        # Third cell: Site Created
                        website_data['site_created'] = cells[2].inner_text().strip()
                        
                        # Fourth cell: Status
                        website_data['status'] = cells[3].inner_text().strip()
                        
                        # Check for WordPress Admin button (5th cell - Actions)
                        if len(cells) >= 5:
                            actions_cell = cells[4]
                            wp_button = actions_cell.query_selector('button:has-text("WORDPRESS ADMIN"), [class*="wordpress"]')
                            if wp_button:
                                website_data['has_wordpress'] = True
                            
                            # Get Site Tools link
                            site_tools_button = actions_cell.query_selector('a:has-text("SITE TOOLS"), button:has-text("SITE TOOLS")')
                            if site_tools_button:
                                href = site_tools_button.get_attribute('href')
                                if href:
                                    website_data['site_tools_url'] = href
                    
                    if website_data['domain']:
                        websites.append(website_data)
                        wp_indicator = "🔷 WP" if website_data['has_wordpress'] else ""
                        print(f"   📌 {website_data['domain']} - {website_data['plan']} {wp_indicator}")
                        
                except Exception as e:
                    print(f"   ⚠️ Satır parse hatası: {str(e)}")
                    continue
            
            self.websites = websites
            print(f"\n✅ Toplam {len(websites)} website bilgisi çekildi")
            
        except Exception as e:
            print(f"❌ Website listesi çekme hatası: {str(e)}")
            # Save page for debugging
            self._save_debug_page('websites_list_error.html')
        
        return websites
    
    def get_site_details(self, domain: str, site_tools_url: str = None) -> Dict[str, Any]:
        """
        Get detailed information for a specific website from Site Tools
        
        From Site Tools Dashboard:
        - Disk Usage (Disk Space in GB, Inodes)
        - IP and Name Servers
        - WordPress version (if installed)
        """
        print(f"🔎 {domain} detayları çekiliyor...")
        
        details = {
            'domain': domain,
            'disk_space': '',
            'inodes': '',
            'site_ip': '',
            'nameservers': [],
            'wordpress_version': '',
            'ssl_status': '',
        }
        
        try:
            # Navigate to Site Tools for this domain
            if site_tools_url:
                self.page.goto(site_tools_url)
            else:
                # Try to find the site in the dropdown or navigate directly
                self.page.goto(f"{self.SITE_TOOLS_URL}")
            
            time.sleep(3)
            
            # Wait for dashboard to load
            self.page.wait_for_selector('.site-information, [class*="dashboard"], h2:has-text("Site Information")', timeout=10000)
            
            # Extract Disk Usage
            disk_section = self.page.query_selector('[class*="disk-usage"], .disk-usage, :has-text("Disk Usage")')
            if disk_section:
                disk_space = disk_section.query_selector(':has-text("Disk Space") + *, [class*="value"]')
                if disk_space:
                    details['disk_space'] = disk_space.inner_text().strip()
                
                inodes = disk_section.query_selector(':has-text("Inodes") + *, [class*="inodes"]')
                if inodes:
                    details['inodes'] = inodes.inner_text().strip()
            
            # Alternative: Look for specific text patterns
            page_text = self.page.inner_text('body')
            
            # Extract disk space (e.g., "1 GB")
            disk_match = re.search(r'Disk Space\s*[\n\r]*\s*(\d+(?:\.\d+)?\s*(?:GB|MB|KB))', page_text)
            if disk_match:
                details['disk_space'] = disk_match.group(1)
            
            # Extract inodes
            inodes_match = re.search(r'Inodes\s*[\n\r]*\s*(\d+)', page_text)
            if inodes_match:
                details['inodes'] = inodes_match.group(1)
            
            # Extract IP
            ip_match = re.search(r'Site IP\s*[\n\r]*\s*([\d.]+)', page_text)
            if ip_match:
                details['site_ip'] = ip_match.group(1)
            
            # Extract nameservers
            ns_matches = re.findall(r'(ns\d+\.siteground\.net)', page_text)
            if ns_matches:
                details['nameservers'] = list(set(ns_matches))
            
            print(f"   ✓ Disk: {details['disk_space']}, IP: {details['site_ip']}")
            
            # Navigate to Security > SSL to get SSL status
            ssl_menu = self.page.query_selector('a:has-text("Security"), [href*="security"]')
            if ssl_menu:
                ssl_menu.click()
                time.sleep(2)
                
                ssl_link = self.page.query_selector('a:has-text("SSL"), [href*="ssl"]')
                if ssl_link:
                    ssl_link.click()
                    time.sleep(2)
                    
                    ssl_status_elem = self.page.query_selector('[class*="ssl-status"], .ssl-active, :has-text("Let\'s Encrypt")')
                    if ssl_status_elem:
                        details['ssl_status'] = 'Active'
            
            # Navigate to WordPress to get version
            wp_menu = self.page.query_selector('a:has-text("WordPress"), [href*="wordpress"]')
            if wp_menu:
                wp_menu.click()
                time.sleep(2)
                
                # Look for WordPress version in the installations table
                version_elem = self.page.query_selector('td:has-text("6."), td:has-text("5.")')
                if version_elem:
                    details['wordpress_version'] = version_elem.inner_text().strip()
            
            time.sleep(REQUEST_DELAY)
            
        except Exception as e:
            print(f"   ⚠️ Detay çekme hatası: {str(e)}")
        
        return details
    
    def _save_debug_page(self, filename: str):
        """Save current page HTML for debugging"""
        try:
            page_content = self.page.content()
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(page_content)
            print(f"📄 Debug sayfası {filename} dosyasına kaydedildi")
        except:
            pass
    
    def scrape_all(self, get_details: bool = False) -> List[Dict[str, Any]]:
        """
        Main method to scrape all website data from SiteGround
        
        Args:
            get_details: If True, also navigate to each site's Site Tools for detailed info
        """
        results = []
        
        try:
            self.start_browser()
            
            if not self.login():
                print("❌ Giriş yapılamadı, işlem durduruluyor")
                return results
            
            self.navigate_to_websites()
            websites = self.get_websites_list()
            
            if get_details:
                print("\n📊 Detaylı bilgiler çekiliyor...")
                for i, website in enumerate(websites):
                    print(f"\n[{i+1}/{len(websites)}] {website['domain']}")
                    details = self.get_site_details(
                        website['domain'], 
                        website.get('site_tools_url')
                    )
                    website.update(details)
                    time.sleep(REQUEST_DELAY)
            
            results = websites
            
        except Exception as e:
            print(f"❌ Scraping hatası: {str(e)}")
        
        finally:
            self.close_browser()
        
        return results
    
    def test_login(self) -> bool:
        """Test login without scraping - keeps browser open for verification"""
        try:
            self.start_browser()
            success = self.login()
            if success:
                self.navigate_to_websites()
                print("\n✅ Test başarılı! Tarayıcıyı kontrol edin.")
            input("\nDevam etmek için Enter'a basın...")
            return success
        finally:
            self.close_browser()


def main():
    """Test the SiteGround scraper"""
    import argparse
    
    parser = argparse.ArgumentParser(description='SiteGround Reseller Panel Scraper')
    parser.add_argument('--test-login', action='store_true', help='Test login only')
    parser.add_argument('--details', action='store_true', help='Get detailed info for each site')
    parser.add_argument('--output', type=str, default='siteground_data.json', help='Output JSON file')
    
    args = parser.parse_args()
    
    scraper = SiteGroundScraper()
    
    if args.test_login:
        scraper.test_login()
        return
    
    websites = scraper.scrape_all(get_details=args.details)
    
    print("\n" + "="*60)
    print("SONUÇLAR")
    print("="*60)
    
    for site in websites:
        print(f"\n🌐 {site.get('domain', 'N/A')}")
        print(f"   Plan: {site.get('plan', 'N/A')}")
        print(f"   Durum: {site.get('status', 'N/A')}")
        print(f"   Oluşturulma: {site.get('site_created', 'N/A')}")
        print(f"   WordPress: {'Evet' if site.get('has_wordpress') else 'Hayır'}")
        if site.get('disk_space'):
            print(f"   Disk: {site.get('disk_space')}")
        if site.get('site_ip'):
            print(f"   IP: {site.get('site_ip')}")
    
    # Save to JSON
    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(websites, f, ensure_ascii=False, indent=2)
    print(f"\n📄 Veriler {args.output} dosyasına kaydedildi")


if __name__ == '__main__':
    main()
