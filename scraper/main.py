"""
SiteGround Scraper Bot - Main Entry Point

This script orchestrates the scraping process:
1. Login to SiteGround and get website list
2. For each website, scrape contact information
3. Create/update customers in CRM

Usage:
    python main.py                     # Full scrape (SiteGround + websites + CRM)
    python main.py --test-login        # Test SiteGround login only
    python main.py --siteground-only   # Scrape SiteGround only (no website scraping)
    python main.py --dry-run           # Scrape but don't update CRM
    python main.py --details           # Get detailed info from Site Tools for each site
"""
import argparse
import json
import sys
from datetime import datetime

from siteground_scraper import SiteGroundScraper
from website_scraper import WebsiteScraper
from crm_client import CRMClient, prepare_customer_data
from config import REQUEST_DELAY


def print_banner():
    """Print application banner"""
    print("""
╔═══════════════════════════════════════════════════════════════╗
║           SiteGround Scraper Bot v1.0                         ║
║           CRM Müşteri Veri Çekme Aracı                        ║
╚═══════════════════════════════════════════════════════════════╝
    """)


def save_results(data: dict, filename: str = None):
    """Save results to JSON file"""
    if not filename:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'scrape_results_{timestamp}.json'
    
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"\n📄 Sonuçlar {filename} dosyasına kaydedildi")
    return filename


def main():
    parser = argparse.ArgumentParser(description='SiteGround Scraper Bot')
    parser.add_argument('--test-login', action='store_true', 
                        help='Test SiteGround login only')
    parser.add_argument('--siteground-only', action='store_true',
                        help='Scrape SiteGround only, skip website scraping')
    parser.add_argument('--dry-run', action='store_true',
                        help='Scrape data but do not update CRM')
    parser.add_argument('--details', action='store_true',
                        help='Get detailed info from Site Tools for each site')
    parser.add_argument('--output', type=str, default=None,
                        help='Output JSON file path')
    parser.add_argument('--limit', type=int, default=None,
                        help='Limit number of sites to process')
    
    args = parser.parse_args()
    
    print_banner()
    
    # Test login mode
    if args.test_login:
        print("🔐 SiteGround giriş testi yapılıyor...")
        scraper = SiteGroundScraper()
        success = scraper.test_login()
        sys.exit(0 if success else 1)
    
    # Initialize results
    results = {
        'timestamp': datetime.now().isoformat(),
        'siteground_sites': [],
        'website_data': [],
        'crm_updates': [],
        'errors': [],
    }
    
    # Step 1: Scrape SiteGround
    print("\n" + "="*60)
    print("ADIM 1: SiteGround'dan website listesi çekiliyor")
    print("="*60)
    
    sg_scraper = SiteGroundScraper()
    
    # Start browser for SiteGround - we'll reuse this for website scraping too
    sg_scraper.start_browser()
    
    try:
        if not sg_scraper.login():
            print("❌ SiteGround'a giriş yapılamadı!")
            save_results(results, args.output)
            sys.exit(1)
        
        sg_scraper.navigate_to_websites()
        siteground_sites = sg_scraper.get_websites_list()
        results['siteground_sites'] = siteground_sites
        
        if not siteground_sites:
            print("❌ SiteGround'dan site listesi çekilemedi!")
            save_results(results, args.output)
            sys.exit(1)
        
        print(f"\n✅ {len(siteground_sites)} site bulundu")
        
        # Apply limit if specified
        sites_to_process = siteground_sites
        if args.limit:
            sites_to_process = siteground_sites[:args.limit]
            print(f"📊 {args.limit} site ile sınırlandırıldı")
        
        # Step 2: Scrape websites using the SAME browser session
        # This may help bypass bot protection since we're already authenticated
        website_data = {}
        
        if not args.siteground_only:
            print("\n" + "="*60)
            print("ADIM 2: Website iletişim bilgileri çekiliyor")
            print("="*60)
            print("   (Aynı tarayıcı oturumu kullanılıyor - bot korumasını atlamak için)")
            
            # Use the existing page from SiteGround scraper
            from website_scraper import WebsiteScraper
            web_scraper = WebsiteScraper(use_existing_browser=True, page=sg_scraper.page)
            
            for i, site in enumerate(sites_to_process):
                domain = site.get('domain', '')
                if not domain:
                    continue
                
                print(f"\n[{i+1}/{len(sites_to_process)}]")
                scraped = web_scraper.scrape_website(domain)
                website_data[domain] = scraped
                results['website_data'].append(scraped)
            
            print(f"\n✅ {len(website_data)} website tarandı")
        else:
            print("\n⏭️ Website tarama atlandı (--siteground-only modu)")
    
    finally:
        sg_scraper.close_browser()
    
    # Step 3: Update CRM (unless dry-run mode)
    if not args.dry_run:
        print("\n" + "="*60)
        print("ADIM 3: CRM güncelleniyor")
        print("="*60)
        
        crm = CRMClient()
        
        if not crm.test_connection():
            print("❌ CRM bağlantısı kurulamadı!")
            results['errors'].append('CRM connection failed')
            save_results(results, args.output)
            sys.exit(1)
        
        for site in sites_to_process:
            domain = site.get('domain', '')
            if not domain:
                continue
            
            print(f"\n🔄 {domain} işleniyor...")
            
            try:
                # Prepare customer data
                sg_data = site
                web_data = website_data.get(domain, {})
                customer_data = prepare_customer_data(domain, sg_data, web_data)
                
                # Create or update customer
                result = crm.create_or_update_customer(domain, customer_data)
                results['crm_updates'].append({
                    'domain': domain,
                    'success': True,
                    'customer_id': result.get('id'),
                })
                print(f"   ✅ Müşteri güncellendi: ID {result.get('id')}")
                
            except Exception as e:
                error_msg = str(e)
                results['crm_updates'].append({
                    'domain': domain,
                    'success': False,
                    'error': error_msg,
                })
                results['errors'].append(f"{domain}: {error_msg}")
                print(f"   ❌ Hata: {error_msg[:100]}")
        
        # Summary
        successful = sum(1 for u in results['crm_updates'] if u['success'])
        failed = len(results['crm_updates']) - successful
        print(f"\n✅ {successful} müşteri başarıyla güncellendi")
        if failed:
            print(f"❌ {failed} hata oluştu")
    else:
        print("\n⏭️ CRM güncelleme atlandı (--dry-run modu)")
    
    # Save results
    save_results(results, args.output)
    
    # Final summary
    print("\n" + "="*60)
    print("ÖZET")
    print("="*60)
    print(f"📊 SiteGround siteleri: {len(siteground_sites)}")
    print(f"🌐 Taranan websiteler: {len(website_data)}")
    print(f"👥 CRM güncellemeleri: {len(results['crm_updates'])}")
    if results['errors']:
        print(f"⚠️ Hatalar: {len(results['errors'])}")
    
    print("\n✨ İşlem tamamlandı!")


if __name__ == '__main__':
    main()
