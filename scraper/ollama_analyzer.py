"""
Ollama Website Analyzer

Bu modül Ollama (yerel AI) + Playwright kullanarak web sitelerinden 
iletişim bilgilerini çeker.

Ollama: Yerel AI - ücretsiz, limitsiz
Playwright: Görünür tarayıcı ile bot korumasını atlar
"""
import json
import os
import time
import re
from typing import Dict, Any, List, Optional

# Playwright
from playwright.sync_api import sync_playwright, Page

# Ollama
try:
    import ollama
except ImportError:
    print("❌ ollama paketi kurulu değil!")
    print("   pip install ollama")
    ollama = None


class OllamaWebsiteAnalyzer:
    """Ollama + Playwright ile website analizi"""
    
    def __init__(self, model: str = "llama3.2"):
        self.model = model
        self.playwright = None
        self.browser = None
        self.page: Optional[Page] = None
    
    def start_browser(self):
        """Tarayıcıyı başlat"""
        print("🚀 Tarayıcı başlatılıyor...")
        self.playwright = sync_playwright().start()
        self.browser = self.playwright.chromium.launch(
            headless=False,  # Görünür mod - bot korumasını atlamak için
            slow_mo=100,
        )
        context = self.browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            locale='tr-TR',
        )
        self.page = context.new_page()
        print("✅ Tarayıcı hazır")
    
    def close_browser(self):
        """Tarayıcıyı kapat"""
        if self.browser:
            self.browser.close()
        if self.playwright:
            self.playwright.stop()
        print("🔒 Tarayıcı kapatıldı")
    
    def _fetch_page_content(self, url: str) -> str:
        """Sayfayı görünür tarayıcı ile aç ve içeriği al"""
        try:
            self.page.goto(url, wait_until='networkidle', timeout=30000)
            time.sleep(2)  # Sayfa tam yüklensin
            
            # Bot challenge varsa bekle
            page_text = self.page.inner_text('body')
            if 'robot' in page_text.lower() or 'challenge' in page_text.lower():
                print("   ⚠️ Bot challenge algılandı, 5 saniye bekleniyor...")
                time.sleep(5)
                page_text = self.page.inner_text('body')
            
            return page_text[:30000]
        except Exception as e:
            print(f"   ⚠️ Sayfa yüklenemedi: {str(e)[:50]}")
            return ""
    
    def _analyze_with_ollama(self, content: str, domain: str) -> Dict:
        """Ollama ile içeriği analiz et"""
        if not ollama:
            return {}
        
        prompt = f"""
Aşağıdaki web sitesi içeriğinden iletişim bilgilerini çıkar.
SADECE JSON formatında döndür, başka hiçbir şey yazma.

İstenen bilgiler:
- phones: Türkiye telefon numaraları listesi (0XXX XXX XX XX formatında)
- emails: Email adresleri listesi
- address: Fiziksel adres
- company_name: Şirket/firma adı
- facebook: Facebook URL
- instagram: Instagram URL veya kullanıcı adı
- twitter: Twitter/X URL
- linkedin: LinkedIn URL

Örnek JSON format:
{{
  "phones": ["0532 123 45 67"],
  "emails": ["info@example.com"],
  "address": "Örnek Mah. Örnek Sok. No:1 İstanbul",
  "company_name": "Örnek Şirket",
  "facebook": "",
  "instagram": "",
  "twitter": "",
  "linkedin": ""
}}

Website ({domain}) içeriği:
{content[:15000]}

SADECE JSON döndür:
"""
        
        try:
            response = ollama.chat(
                model=self.model,
                messages=[{'role': 'user', 'content': prompt}]
            )
            text = response['message']['content'].strip()
            
            # JSON'u parse et
            if '```json' in text:
                text = text.split('```json')[1].split('```')[0]
            elif '```' in text:
                text = text.split('```')[1].split('```')[0]
            
            # JSON bul
            start = text.find('{')
            end = text.rfind('}') + 1
            if start >= 0 and end > start:
                text = text[start:end]
            
            return json.loads(text)
        except Exception as e:
            print(f"   ⚠️ Ollama hatası: {str(e)[:50]}")
            return {}
    
    def _extract_with_regex(self, content: str) -> Dict:
        """Regex ile temel bilgileri çıkar"""
        result = {'phones': [], 'emails': []}
        
        # Email
        emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', content)
        for email in emails:
            email = email.lower()
            if not any(x in email for x in ['example.', 'domain.', 'sentry.', 'wordpress.']):
                if email not in result['emails']:
                    result['emails'].append(email)
        result['emails'] = result['emails'][:5]
        
        # Telefon
        phone_patterns = [
            r'(?:\+90\s?)?0?\s?5\d{2}[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}',
            r'0\s?\d{3}[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}',
        ]
        for pattern in phone_patterns:
            matches = re.findall(pattern, content)
            for match in matches:
                cleaned = re.sub(r'[^\d+]', '', match)
                if len(cleaned) >= 10 and cleaned not in result['phones']:
                    result['phones'].append(cleaned)
        result['phones'] = result['phones'][:5]
        
        return result
    
    def analyze_website(self, domain: str) -> Dict[str, Any]:
        """Websiteyi analiz et"""
        print(f"🔍 {domain} analiz ediliyor...")
        
        result = {
            'domain': domain,
            'phones': [],
            'emails': [],
            'address': '',
            'social': {'facebook': '', 'instagram': '', 'twitter': '', 'linkedin': ''},
            'company_name': '',
            'analyzed': False,
            'error': None,
        }
        
        # Sayfa içeriğini al
        urls_to_try = [
            f'https://{domain}',
            f'https://www.{domain}',
        ]
        
        content = ""
        for url in urls_to_try:
            content = self._fetch_page_content(url)
            if content and len(content) > 500:
                break
        
        if not content or len(content) < 100:
            # İletişim sayfasını dene
            for path in ['/iletisim', '/contact', '/contact-us', '/bize-ulasin']:
                contact_url = f'https://{domain}{path}'
                contact_content = self._fetch_page_content(contact_url)
                if contact_content and len(contact_content) > 100:
                    content += '\n\n' + contact_content
                    break
        
        if not content or len(content) < 100:
            result['error'] = 'Site içeriği alınamadı'
            print(f"   ❌ İçerik alınamadı")
            return result
        
        # Önce regex ile dene
        regex_result = self._extract_with_regex(content)
        result['phones'] = regex_result['phones']
        result['emails'] = regex_result['emails']
        
        # Ollama ile detaylı analiz
        print(f"   🤖 Ollama analiz ediyor...")
        ollama_result = self._analyze_with_ollama(content, domain)
        
        if ollama_result:
            if ollama_result.get('phones') and not result['phones']:
                result['phones'] = ollama_result['phones']
            if ollama_result.get('emails') and not result['emails']:
                result['emails'] = ollama_result['emails']
            if ollama_result.get('address'):
                result['address'] = ollama_result['address']
            if ollama_result.get('company_name'):
                result['company_name'] = ollama_result['company_name']
            
            result['social']['facebook'] = ollama_result.get('facebook', '')
            result['social']['instagram'] = ollama_result.get('instagram', '')
            result['social']['twitter'] = ollama_result.get('twitter', '')
            result['social']['linkedin'] = ollama_result.get('linkedin', '')
        
        result['analyzed'] = True
        
        print(f"   ✅ Tamamlandı:")
        print(f"      📧 {len(result['emails'])} email: {', '.join(result['emails'][:2])}")
        print(f"      📱 {len(result['phones'])} telefon: {', '.join(result['phones'][:2])}")
        if result['company_name']:
            print(f"      🏢 {result['company_name'][:40]}")
        
        return result
    
    def analyze_multiple(self, domains: List[str]) -> List[Dict[str, Any]]:
        """Birden fazla domain analiz et"""
        results = []
        
        try:
            self.start_browser()
            
            for i, domain in enumerate(domains):
                print(f"\n[{i+1}/{len(domains)}]")
                result = self.analyze_website(domain)
                results.append(result)
                time.sleep(1)
        
        finally:
            self.close_browser()
        
        return results


def generate_update_sql(results: List[Dict]) -> str:
    """SQL UPDATE oluştur"""
    sql_lines = ["-- Ollama AI ile çekilen müşteri bilgileri", f"-- Tarih: {time.strftime('%Y-%m-%d %H:%M')}\n"]
    
    for r in results:
        if not r.get('analyzed'):
            continue
        
        domain = r['domain']
        updates = []
        
        if r.get('phones'):
            phone = r['phones'][0].replace("'", "''")
            updates.append(f"phone = '{phone}'")
        
        if r.get('emails'):
            email = r['emails'][0].replace("'", "''")
            updates.append(f"email = '{email}'")
        
        if r.get('address'):
            address = r['address'].replace("'", "''").replace('\n', ' ')[:200]
            updates.append(f"address = '{address}'")
        
        if r.get('company_name'):
            name = r['company_name'].replace("'", "''")[:100]
            updates.append(f"company_name = '{name}'")
        
        social = r.get('social', {})
        for key in ['facebook', 'instagram', 'linkedin', 'twitter']:
            if social.get(key):
                val = social[key].replace("'", "''")[:200]
                updates.append(f"{key} = '{val}'")
        
        if updates:
            sql = f"UPDATE customers SET {', '.join(updates)}, updated_at = NOW() WHERE website LIKE '%{domain}%';"
            sql_lines.append(sql)
    
    return '\n'.join(sql_lines)


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Ollama Website Analyzer')
    parser.add_argument('--domain', type=str, help='Single domain')
    parser.add_argument('--file', type=str, help='JSON file with domains')
    parser.add_argument('--model', type=str, default='llama3.2', help='Ollama model')
    parser.add_argument('--output', type=str, default='ollama_results.json')
    parser.add_argument('--sql', type=str, default='update_customers.sql')
    
    args = parser.parse_args()
    
    # Ollama test
    if not ollama:
        print("❌ pip install ollama gerekli!")
        return
    
    try:
        ollama.list()
        print(f"✅ Ollama bağlantısı başarılı")
    except Exception as e:
        print(f"❌ Ollama çalışmıyor: {e}")
        print("   ollama serve komutunu çalıştırın")
        return
    
    analyzer = OllamaWebsiteAnalyzer(model=args.model)
    domains = []
    
    if args.domain:
        domains = [args.domain]
    elif args.file:
        with open(args.file, 'r') as f:
            data = json.load(f)
            if 'siteground_sites' in data:
                domains = [s['domain'] for s in data['siteground_sites']]
            else:
                domains = data
    else:
        domains = ['rezonall.com']
    
    print(f"\n📋 {len(domains)} domain analiz edilecek")
    print(f"🤖 Model: {args.model}\n")
    
    results = analyzer.analyze_multiple(domains)
    
    # Kaydet
    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"\n📄 Sonuçlar {args.output} dosyasına kaydedildi")
    
    sql_content = generate_update_sql(results)
    with open(args.sql, 'w', encoding='utf-8') as f:
        f.write(sql_content)
    print(f"📝 SQL: {args.sql}")
    
    # Özet
    analyzed = sum(1 for r in results if r.get('analyzed'))
    with_phone = sum(1 for r in results if r.get('phones'))
    with_email = sum(1 for r in results if r.get('emails'))
    
    print(f"\n{'='*50}")
    print("ÖZET")
    print(f"{'='*50}")
    print(f"✅ Analiz: {analyzed}/{len(results)}")
    print(f"📱 Telefon: {with_phone}")
    print(f"📧 Email: {with_email}")


if __name__ == '__main__':
    main()
