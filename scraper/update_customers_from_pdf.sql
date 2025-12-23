-- PDF'den çıkarılan müşteri iletişim bilgileri güncellemesi
-- Tarih: 2024-12-22
-- Kaynak: Şirket_İletişim_Bilgileri_ve_İş_Tanımları.pdf

-- 1. Tutku Homes
UPDATE customers SET 
    phone = '0533 818 04 82',
    email = 'info@tutkuhomes.com',
    address = 'Alanya, Antalya',
    sector = 'Emlak & Gayrimenkul',
    notes = 'Alanya bölgesinde gayrimenkul danışmanlığı, satış ve kiralama hizmetleri sunan profesyonel bir emlak firması.',
    facebook = 'https://facebook.com/tutkuhomes',
    instagram = '@tutkuhomes',
    updated_at = NOW()
WHERE website LIKE '%tutkuhomes.com%';

-- 2. Eis Kuyumculuk (Eis Gold)
UPDATE customers SET 
    phone = '0532 656 56 42',
    email = 'info@eisgold.com.tr',
    sector = 'Kuyumculuk & Takı',
    notes = 'Online altın ve pırlanta takı satışı yapan profesyonel bir kuyumculuk firması. Kaliteli ürünler ve güvenilir hizmet sunmaktadır.',
    updated_at = NOW()
WHERE website LIKE '%eisgold.com%';

-- 3. Forjetec
UPDATE customers SET 
    phone = '0534 722 44 35',
    email = 'info@forjetec.com',
    address = 'Ümraniye/İstanbul',
    city = 'İstanbul',
    district = 'Ümraniye',
    sector = '3D Animasyon & Prodüksiyon',
    notes = '3D Animasyon, Görsel Efekt (VFX) ve Karakter Tasarımı hizmetleri sunan profesyonel bir prodüksiyon stüdyosu.',
    updated_at = NOW()
WHERE website LIKE '%forjetec.com%';

-- 4. Vuvita (Yapım aşamasında)
UPDATE customers SET 
    notes = 'Web sitesi yapım aşamasında. Detaylı bilgiler henüz toplanamamıştır.',
    updated_at = NOW()
WHERE website LIKE '%vuvita.com%';

-- 5. Kaza Tazminatınız
UPDATE customers SET 
    phone = '0533 687 69 34',
    email = 'info@kazatazminatiniz.com',
    address = 'Kültür Mahallesi, Akdeniz, Mersin',
    city = 'Mersin',
    district = 'Akdeniz',
    sector = 'Hukuk & Sigorta Danışmanlığı',
    notes = 'Araç değer kaybı, yaralanmalı ve ölümlü trafik kazaları sonrası tazminat hesaplama ve hukuki süreç takibi hizmetleri sunan profesyonel bir danışmanlık firması.',
    updated_at = NOW()
WHERE website LIKE '%kazatazminatiniz.com%';

-- 6. Ağabey Group
UPDATE customers SET 
    sector = 'Çok Sektörlü Ticaret Grubu',
    notes = 'Tarım, sigorta, gayrimenkul ve perakende sektörlerinde faaliyet gösteren güçlü bir ticaret grubu. Modern vizyonu ve kurumsal yapısıyla Türkiye için üretiyor, global standartlarda hizmet sunuyor.',
    updated_at = NOW()
WHERE website LIKE '%agabeygroup.com%';

-- 7. MOOD-MESSE
UPDATE customers SET 
    phone = '0555 296 64 39',
    email = 'info@moodmesse.com',
    sector = 'Fuar & Etkinlik',
    instagram = '@moodmesse',
    twitter = '@moodmesse',
    notes = 'Fuar ve etkinlikler için özelleştirilmiş standlar, nitelikli personel, görsel sistemler ve promosyon malzemeleri sağlayan profesyonel bir hizmet firması.',
    updated_at = NOW()
WHERE website LIKE '%moodmesse.com%';

-- 8. Astravolt Transformer
UPDATE customers SET 
    phone = '0543 211 52 83',
    email = 'info@astravoltrafo.com.tr',
    sector = 'Enerji & Trafo İmalatı',
    notes = 'Trafo imalatı, enerji altyapı sistemleri ve transformatör çözümleri sunan profesyonel bir firma. 12+ yıllık deneyim, yüksek kalite standartları ve müşteri odaklı yaklaşım.',
    updated_at = NOW()
WHERE website LIKE '%astravoltrafo.com%';

-- 9. Mood-Expo
UPDATE customers SET 
    phone = '0212 912 40 19',
    secondary_phone = '0850 811 81 12',
    email = 'info@mood-expo.com',
    sector = 'Fuar & Etkinlik Hizmetleri',
    instagram = '@moodexpo',
    notes = 'Fuar standı tasarımı, üretimi, kurulumu ve etkinlik desteği hizmetleri sunan profesyonel bir firma. Markaların fuarlarda en güçlü şekilde temsil edilmesini sağlamaktadır.',
    updated_at = NOW()
WHERE website LIKE '%mood-expo.com%';

-- 10. Eis Grup İnşaat
UPDATE customers SET 
    phone = '0532 656 56 42',
    email = 'info@eisgroup.com.tr',
    address = 'Kızlar Pınarı Mahallesi, Spor Caddesi 2/B, Alanya, Antalya',
    city = 'Antalya',
    district = 'Alanya',
    sector = 'İnşaat & Gayrimenkul',
    notes = 'Antalya bölgesinde inşaat, müteahhitlik, turizm ve gayrimenkul sektörlerinde faaliyet gösteren profesyonel bir grup. 20+ yıllık tecrübe. Hizmetler: Müteahhitlik, Anahtar Teslim Projeler, Gayrimenkul Danışmanlığı, Turizm, Taşeronluk, Rent a Car.',
    updated_at = NOW()
WHERE website LIKE '%eisgroup.com%';

-- 11. Zeya Mühendislik
UPDATE customers SET 
    phone = '0534 243 27 28',
    email = 'info@zeyamuhendislik.com.tr',
    address = 'Hasanpaşa Mh., Hürriyet Sk. No: 64-66, Kadıköy, İstanbul',
    city = 'İstanbul',
    district = 'Kadıköy',
    sector = 'Mimarlık & Mühendislik',
    facebook = 'https://facebook.com/zeyamuhendislik',
    instagram = '@zeyamuhendislik',
    twitter = '@zeyamuhendislik',
    linkedin = 'https://linkedin.com/company/zeyamuhendislik',
    notes = 'Mimarlık, mühendislik ve inşaat alanlarında projelendirme ve uygulama hizmetleri sunan profesyonel bir firma. Hizmetler: Mimari Tasarım, Mühendislik, İnşaat Yönetimi, Teknik Danışmanlık, Ruhsatlandırma.',
    updated_at = NOW()
WHERE website LIKE '%zeyamuhendislik.com%';

-- 12. Emrullah Köroğlu
UPDATE customers SET 
    contact_person = 'Emrullah Köroğlu',
    sector = 'Moda Tasarımı & Haute Couture',
    notes = 'Moda tasarımcısı ve Haute Couture sanatçısı. Özel dikim, gelinlik, abiye ve sahne kostümleri tasarlamaktadır. Nişantaşı''ndaki showroom''u ile birçok ünlünün tercihi. Tasarladığı elbiselerin kalıp, kesim ve dikimini kendisi yapmaktadır.',
    updated_at = NOW()
WHERE website LIKE '%emrullahkoroglu.com%';

-- 13. UDS Yapı (Pergola Cam Sistemleri)
UPDATE customers SET 
    phone = '0532 644 68 86',
    email = 'info@udspergolacamsistemleri.com',
    address = 'Barbaros, 8/1. Sk. No:12, Bağcılar/İstanbul',
    city = 'İstanbul',
    district = 'Bağcılar',
    sector = 'Yapı & Mimari Çözümler',
    facebook = 'https://facebook.com/udspergola',
    instagram = '@udspergola',
    twitter = '@udspergola',
    notes = 'Pergola, cam balkon, cam tavan, giyotin cam sistemleri gibi modern yapı ve mimari çözümler sunan profesyonel bir firma. Ürünler: Cam Balkon, Otomatik Pergola, Giyotin Cam, Fotoselli Kapı, Kış Bahçesi.',
    updated_at = NOW()
WHERE website LIKE '%udspergolacamsistemleri.com%';

-- 14. RezonAll
UPDATE customers SET 
    sector = 'Yapay Zeka & Otomasyon',
    notes = 'Otel ve restoranlar için yapay zeka destekli sesli asistan ve müşteri hizmetleri otomasyon çözümleri sunar. 7/24 kesintisiz hizmet ile operasyonel verimliliği artırır.',
    updated_at = NOW()
WHERE website LIKE '%rezonall.com%';

-- 15. Tangül Doğalgaz Sıhhi Tesisat
UPDATE customers SET 
    phone = '0538 506 28 57',
    email = 'info@tangulsihhitesisatcim.com.tr',
    address = 'Merkez Mecidiye, Afyonkarahisar/Türkiye',
    city = 'Afyonkarahisar',
    sector = 'Doğalgaz & Sıhhi Tesisat',
    facebook = 'https://facebook.com/tangultesisat',
    instagram = '@tangultesisat',
    notes = 'Doğalgaz, sıhhi tesisat, kombi, petek montajı, arıza ve bakım hizmetleri sunan profesyonel bir tesisat firması. Hızlı, güvenilir ve kaliteli hizmet.',
    updated_at = NOW()
WHERE website LIKE '%tanguldogalgazsihhitesisatcim.com%';

-- 16. En Yakın Elektrikçi 724
UPDATE customers SET 
    sector = 'Acil Elektrik Hizmetleri',
    notes = '7/24 açık acil elektrik hizmetleri sunan profesyonel bir firma.',
    updated_at = NOW()
WHERE website LIKE '%enyakinelektrikci724.com%';

-- 17. Devin Yangın
UPDATE customers SET 
    sector = 'Yangın Güvenliği',
    notes = 'Yangın güvenliği ve söndürme sistemleri hizmetleri.',
    updated_at = NOW()
WHERE website LIKE '%devinyangin.com%';

-- Güncellenen kayıtları kontrol et
SELECT id, company_name, phone, email, city, sector 
FROM customers 
WHERE company_id = 1 
ORDER BY id;
