"""
Gemini API Website Analyzer v2

Bu modül Google Gemini AI kullanarak web sitelerinden iletişim bilgilerini çeker.
Yeni google-genai paketi kullanır.
"""
import json
import os
import time
import requests
from typing import Dict, Any, List

# Yeni Gemini SDK
from google import genai
from google.genai import types


class GeminiWebsiteAnalyzer:
    """Gemini AI kullanarak website analizi"""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv('GEMINI_API_KEY', '')
        
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY environment variable gerekli!")
        
        self.client = genai.Client(api_key=self.api_key)
    
    def _fetch_website_content(self, url: str) -> str:
        """Website içeriğini fetch et"""
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
        }
        
        try:
            response = requests.get(url, headers=headers, timeout=15, allow_redirects=True)
            if response.status_code == 200:
                return response.text[:50000]
            return ""
        except:
            return ""
    
    def analyze_website(self, domain: str) -> Dict[str, Any]:
        """
        Gemini API kullanarak websiteyi analiz et
        """
        print(f"🔍 {domain} analiz ediliyor (Gemini AI)...")
        
        result = {
            'domain': domain,
            'phones': [],
            'emails': [],
            'address': '',
            'social': {
                'facebook': '',
                'instagram': '',
                'twitter': '',
                'linkedin': '',
            },
            'company_name': '',
            'description': '',
            'analyzed': False,
            'error': None,
        }
        
        # Website URL'leri
        base_url = f'https://{domain}'
        www_url = f'https://www.{domain}'
        
        # İçerik topla
        all_content = []
        for url in [base_url, www_url, f'{base_url}/iletisim', f'{base_url}/contact']:
            content = self._fetch_website_content(url)
            if content and len(content) > 500:
                all_content.append(content[:20000])
                break  # İlk başarılı içeriği al
        
        if not all_content:
            result['error'] = 'Website içeriği alınamadı'
            print(f"   ❌ İçerik alınamadı")
            return result
        
        combined_content = all_content[0][:40000]
        
        prompt = f"""
Aşağıdaki web sitesi HTML içeriğini analiz et ve şu bilgileri JSON formatında çıkar:

1. phones: Türkiye telefon numaraları listesi
2. emails: Email adresleri listesi
3. address: Fiziksel adres (varsa)
4. company_name: Şirket/firma adı
5. description: Kısa şirket açıklaması (1-2 cümle)
6. facebook: Facebook URL (varsa)
7. instagram: Instagram URL veya kullanıcı adı (varsa)
8. twitter: Twitter/X URL (varsa)
9. linkedin: LinkedIn URL (varsa)

SADECE JSON döndür. Bulunamayan alanlar için boş string veya boş liste kullan.

Website içeriği:
{combined_content}
"""
        
        try:
            response = self.client.models.generate_content(
                model='gemini-2.0-flash',
                contents=prompt
            )
            response_text = response.text.strip()
            
            # JSON'u parse et
            if '```json' in response_text:
                response_text = response_text.split('```json')[1].split('```')[0]
            elif '```' in response_text:
                response_text = response_text.split('```')[1].split('```')[0]
            
            data = json.loads(response_text)
            
            result['phones'] = data.get('phones', [])
            result['emails'] = data.get('emails', [])
            result['address'] = data.get('address', '')
            result['company_name'] = data.get('company_name', '')
            result['description'] = data.get('description', '')
            result['social']['facebook'] = data.get('facebook', '')
            result['social']['instagram'] = data.get('instagram', '')
            result['social']['twitter'] = data.get('twitter', '')
            result['social']['linkedin'] = data.get('linkedin', '')
            result['analyzed'] = True
            
            print(f"   ✅ Analiz tamamlandı:")
            print(f"      📧 {len(result['emails'])} email")
            print(f"      📱 {len(result['phones'])} telefon")
            if result['company_name']:
                print(f"      🏢 {result['company_name']}")
                
        except json.JSONDecodeError as e:
            result['error'] = f'JSON parse hatası'
            print(f"   ⚠️ JSON hatası")
        except Exception as e:
            result['error'] = str(e)[:200]
            print(f"   ❌ Hata: {str(e)[:100]}")
        
        return result
    
    def analyze_multiple(self, domains: List[str], delay: float = 1.0) -> List[Dict[str, Any]]:
        """Birden fazla websiteyi analiz et"""
        results = []
        
        for i, domain in enumerate(domains):
            print(f"\n[{i+1}/{len(domains)}]")
            result = self.analyze_website(domain)
            results.append(result)
            
            if i < len(domains) - 1:
                time.sleep(delay)
        
        return results


def generate_update_sql(results: List[Dict]) -> str:
    """Gemini sonuçlarından SQL UPDATE oluştur"""
    sql_lines = ["-- Gemini AI ile çekilen müşteri bilgileri güncellemesi", f"-- Tarih: {time.strftime('%Y-%m-%d %H:%M')}\n"]
    
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
            # info@ ile başlamıyorsa güncelle
            if not email.startswith('info@'):
                updates.append(f"email = '{email}'")
        
        if r.get('address'):
            address = r['address'].replace("'", "''").replace('\n', ' ')
            updates.append(f"address = '{address}'")
        
        if r.get('company_name'):
            name = r['company_name'].replace("'", "''")
            updates.append(f"company_name = '{name}'")
        
        social = r.get('social', {})
        if social.get('facebook'):
            updates.append(f"facebook = '{social['facebook'].replace(chr(39), chr(39)+chr(39))}'")
        if social.get('instagram'):
            updates.append(f"instagram = '{social['instagram'].replace(chr(39), chr(39)+chr(39))}'")
        if social.get('linkedin'):
            updates.append(f"linkedin = '{social['linkedin'].replace(chr(39), chr(39)+chr(39))}'")
        if social.get('twitter'):
            updates.append(f"twitter = '{social['twitter'].replace(chr(39), chr(39)+chr(39))}'")
        
        if updates:
            sql = f"UPDATE customers SET {', '.join(updates)}, updated_at = NOW() WHERE website LIKE '%{domain}%';"
            sql_lines.append(sql)
    
    return '\n'.join(sql_lines)


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Gemini AI Website Analyzer v2')
    parser.add_argument('--domain', type=str, help='Single domain to analyze')
    parser.add_argument('--file', type=str, help='JSON file with domain list')
    parser.add_argument('--output', type=str, default='gemini_results.json', help='Output file')
    parser.add_argument('--sql', type=str, default='update_customers.sql', help='SQL output file')
    
    args = parser.parse_args()
    
    if not os.getenv('GEMINI_API_KEY'):
        print("❌ GEMINI_API_KEY environment variable gerekli!")
        return
    
    analyzer = GeminiWebsiteAnalyzer()
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
        domains = ['rezonall.com']  # Test
    
    print(f"📋 {len(domains)} domain analiz edilecek\n")
    
    results = analyzer.analyze_multiple(domains)
    
    # JSON kaydet
    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"\n📄 Sonuçlar {args.output} dosyasına kaydedildi")
    
    # SQL oluştur
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
