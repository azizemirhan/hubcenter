"""
Wayback Machine Website Analyzer

Wayback Machine (Archive.org) kullanarak web sitelerinin önbellek versiyonlarından
iletişim bilgilerini çeker. Bot koruması bu yöntemle aşılabilir.
"""
import json
import os
import time
import re
import requests
from typing import Dict, Any, List, Optional

# Gemini
from google import genai


class WaybackAnalyzer:
    """Wayback Machine + Gemini ile website analizi"""
    
    WAYBACK_API = "https://archive.org/wayback/available"
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv('GEMINI_API_KEY', '')
        if self.api_key:
            self.client = genai.Client(api_key=self.api_key)
        else:
            self.client = None
    
    def _get_wayback_url(self, url: str) -> Optional[str]:
        """Wayback Machine'den en son snapshot URL'ini al"""
        try:
            response = requests.get(
                self.WAYBACK_API,
                params={'url': url},
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                snapshot = data.get('archived_snapshots', {}).get('closest', {})
                if snapshot.get('available'):
                    return snapshot.get('url')
        except:
            pass
        return None
    
    def _fetch_content(self, url: str) -> str:
        """URL içeriğini fetch et"""
        try:
            response = requests.get(url, timeout=15)
            if response.status_code == 200:
                return response.text[:50000]
        except:
            pass
        return ""
    
    def _extract_contact_with_regex(self, html: str) -> Dict:
        """Regex ile iletişim bilgilerini çıkar"""
        result = {
            'phones': [],
            'emails': [],
            'address': '',
            'facebook': '',
            'instagram': '',
            'twitter': '',
            'linkedin': '',
        }
        
        # Email
        email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        emails = re.findall(email_pattern, html)
        # Filter
        filtered_emails = []
        for email in emails:
            email = email.lower()
            if not any(x in email for x in ['example.com', 'domain.com', 'sentry.io', 'wp.', 'wordpress']):
                if email not in filtered_emails:
                    filtered_emails.append(email)
        result['emails'] = filtered_emails[:5]
        
        # Türkiye telefon
        phone_patterns = [
            r'(?:\+90\s?)?(?:0?\s?)?5\d{2}[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}',  # Mobil
            r'(?:\+90\s?)?(?:0?\s?)?\d{3}[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}',  # Sabit
            r'0\s?\d{3}\s?\d{3}\s?\d{2}\s?\d{2}',
        ]
        phones = []
        for pattern in phone_patterns:
            matches = re.findall(pattern, html)
            for match in matches:
                cleaned = re.sub(r'[^\d+]', '', match)
                if len(cleaned) >= 10 and cleaned not in phones:
                    phones.append(cleaned)
        result['phones'] = phones[:5]
        
        # Sosyal medya
        fb = re.search(r'href=["\']?(https?://(?:www\.)?facebook\.com/[^"\'\s>]+)', html)
        if fb:
            result['facebook'] = fb.group(1)
        
        ig = re.search(r'href=["\']?(https?://(?:www\.)?instagram\.com/[^"\'\s>]+)', html)
        if ig:
            result['instagram'] = ig.group(1)
        
        tw = re.search(r'href=["\']?(https?://(?:www\.)?(?:twitter|x)\.com/[^"\'\s>]+)', html)
        if tw:
            result['twitter'] = tw.group(1)
        
        li = re.search(r'href=["\']?(https?://(?:www\.)?linkedin\.com/[^"\'\s>]+)', html)
        if li:
            result['linkedin'] = li.group(1)
        
        return result
    
    def analyze_website(self, domain: str) -> Dict[str, Any]:
        """Website'i Wayback Machine üzerinden analiz et"""
        print(f"🔍 {domain} analiz ediliyor...")
        
        result = {
            'domain': domain,
            'phones': [],
            'emails': [],
            'address': '',
            'social': {'facebook': '', 'instagram': '', 'twitter': '', 'linkedin': ''},
            'company_name': '',
            'description': '',
            'analyzed': False,
            'source': '',
            'error': None,
        }
        
        # Önce direkt deneme
        urls_to_try = [
            f'https://{domain}',
            f'https://www.{domain}',
            f'https://{domain}/iletisim',
            f'https://{domain}/contact',
        ]
        
        content = ""
        source = ""
        
        # 1. Direkt erişim dene
        for url in urls_to_try[:2]:
            content = self._fetch_content(url)
            if content and len(content) > 1000 and '403' not in content[:100]:
                source = "direct"
                print(f"   📥 Direkt erişim başarılı")
                break
        
        # 2. Wayback Machine dene
        if not content or len(content) < 1000:
            print(f"   🕐 Wayback Machine deneniyor...")
            for url in urls_to_try:
                wayback_url = self._get_wayback_url(url)
                if wayback_url:
                    content = self._fetch_content(wayback_url)
                    if content and len(content) > 1000:
                        source = "wayback"
                        print(f"   📚 Arşiv bulundu")
                        break
        
        if not content or len(content) < 500:
            result['error'] = 'İçerik alınamadı'
            print(f"   ❌ İçerik bulunamadı")
            return result
        
        result['source'] = source
        
        # Regex ile bilgi çıkar
        extracted = self._extract_contact_with_regex(content)
        result['phones'] = extracted['phones']
        result['emails'] = extracted['emails']
        result['social']['facebook'] = extracted['facebook']
        result['social']['instagram'] = extracted['instagram']
        result['social']['twitter'] = extracted['twitter']
        result['social']['linkedin'] = extracted['linkedin']
        
        # Şirket adını title'dan al
        title_match = re.search(r'<title>([^<]+)</title>', content, re.IGNORECASE)
        if title_match:
            title = title_match.group(1).strip()
            # Temizle
            result['company_name'] = title.split('|')[0].split('-')[0].split('–')[0].strip()
        
        # Gemini ile daha detaylı analiz (opsiyonel)
        if self.client and (not result['phones'] or not result['emails']):
            try:
                prompt = f"""
Bu HTML içeriğinden sadece şu bilgileri JSON olarak çıkar:
- phones: telefon numaraları listesi
- emails: email adresleri listesi  
- address: fiziksel adres
- company_name: şirket adı

SADECE JSON döndür:
{content[:30000]}
"""
                response = self.client.models.generate_content(
                    model='gemini-2.0-flash-exp',
                    contents=prompt
                )
                text = response.text.strip()
                if '```' in text:
                    text = text.split('```')[1].replace('json', '').strip()
                data = json.loads(text)
                
                if data.get('phones') and not result['phones']:
                    result['phones'] = data['phones']
                if data.get('emails') and not result['emails']:
                    result['emails'] = data['emails']
                if data.get('address'):
                    result['address'] = data['address']
                if data.get('company_name') and not result['company_name']:
                    result['company_name'] = data['company_name']
            except:
                pass
        
        result['analyzed'] = True
        
        # Özet
        print(f"   ✅ Başarılı ({source}):")
        print(f"      📧 {len(result['emails'])} email: {', '.join(result['emails'][:2])}")
        print(f"      📱 {len(result['phones'])} telefon: {', '.join(result['phones'][:2])}")
        if result['company_name']:
            print(f"      🏢 {result['company_name'][:50]}")
        
        return result
    
    def analyze_multiple(self, domains: List[str], delay: float = 0.5) -> List[Dict[str, Any]]:
        """Birden fazla domain analiz et"""
        results = []
        for i, domain in enumerate(domains):
            print(f"\n[{i+1}/{len(domains)}]")
            result = self.analyze_website(domain)
            results.append(result)
            if i < len(domains) - 1:
                time.sleep(delay)
        return results


def generate_update_sql(results: List[Dict]) -> str:
    """SQL UPDATE oluştur"""
    sql_lines = ["-- Wayback Machine ile çekilen müşteri bilgileri güncellemesi", f"-- Tarih: {time.strftime('%Y-%m-%d %H:%M')}\n"]
    
    for r in results:
        if not r.get('analyzed'):
            continue
        
        domain = r['domain']
        updates = []
        
        if r.get('phones'):
            phone = r['phones'][0].replace("'", "''")
            updates.append(f"phone = '{phone}'")
        
        if r.get('emails'):
            for email in r['emails']:
                if not email.startswith('info@'):
                    updates.append(f"email = '{email.replace(chr(39), chr(39)+chr(39))}'")
                    break
        
        if r.get('address'):
            updates.append(f"address = '{r['address'].replace(chr(39), chr(39)+chr(39))}'")
        
        if r.get('company_name'):
            name = r['company_name'].replace("'", "''")[:100]
            updates.append(f"company_name = '{name}'")
        
        social = r.get('social', {})
        for key in ['facebook', 'instagram', 'linkedin', 'twitter']:
            if social.get(key):
                updates.append(f"{key} = '{social[key].replace(chr(39), chr(39)+chr(39))}'")
        
        if updates:
            sql = f"UPDATE customers SET {', '.join(updates)}, updated_at = NOW() WHERE website LIKE '%{domain}%';"
            sql_lines.append(sql)
    
    return '\n'.join(sql_lines)


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Wayback Machine Website Analyzer')
    parser.add_argument('--domain', type=str, help='Single domain')
    parser.add_argument('--file', type=str, help='JSON file with domains')
    parser.add_argument('--output', type=str, default='wayback_results.json')
    parser.add_argument('--sql', type=str, default='update_customers.sql')
    
    args = parser.parse_args()
    
    analyzer = WaybackAnalyzer()
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
    
    print(f"📋 {len(domains)} domain analiz edilecek\n")
    
    results = analyzer.analyze_multiple(domains)
    
    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"\n📄 Sonuçlar {args.output} dosyasına kaydedildi")
    
    sql_content = generate_update_sql(results)
    with open(args.sql, 'w', encoding='utf-8') as f:
        f.write(sql_content)
    print(f"📝 SQL güncellemeleri {args.sql} dosyasına kaydedildi")
    
    # Özet
    analyzed = sum(1 for r in results if r.get('analyzed'))
    with_phone = sum(1 for r in results if r.get('phones'))
    with_email = sum(1 for r in results if r.get('emails'))
    
    print(f"\n{'='*50}")
    print("ÖZET")
    print(f"{'='*50}")
    print(f"✅ Analiz edilen: {analyzed}/{len(results)}")
    print(f"📱 Telefon bulunan: {with_phone}")
    print(f"📧 Email bulunan: {with_email}")


if __name__ == '__main__':
    main()
