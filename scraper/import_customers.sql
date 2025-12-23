-- SiteGround Müşterileri SQL Import Script
-- Tarih: 2025-12-22
-- 17 müşteri kaydı
-- company_id = 1 (Test Main Company)

INSERT INTO customers (
    company_id,
    company_name, 
    contact_person, 
    email, 
    phone,
    title,
    secondary_email,
    secondary_phone,
    address,
    city,
    district,
    postal_code,
    country,
    tax_number,
    tax_office,
    trade_registry_no,
    mersis_no,
    sector,
    industry,
    website,
    annual_revenue,
    facebook,
    instagram,
    linkedin,
    twitter,
    status,
    priority,
    source,
    has_hosting_service, 
    has_web_design_service,
    has_seo_service,
    has_social_media_service,
    has_ads_service,
    notes,
    tags,
    created_at, 
    updated_at
) VALUES
(1, 'Tutku Homes', 'Yetkili Kişi', 'info@tutkuhomes.com.tr', '', '', '', '', '', '', '', '', 'Türkiye', '', '', '', '', '', '', 'https://tutkuhomes.com.tr', '', '', '', '', '', 'active', 'normal', 'website', true, false, false, false, false, 'SiteGround Hosting - Plan: Hosting Plan', '', NOW(), NOW()),
(1, 'Eis Gold', 'Yetkili Kişi', 'info@eisgold.com.tr', '', '', '', '', '', '', '', '', 'Türkiye', '', '', '', '', '', '', 'https://eisgold.com.tr', '', '', '', '', '', 'active', 'normal', 'website', true, true, false, false, false, 'SiteGround Hosting - WordPress', '', NOW(), NOW()),
(1, 'Forjetec', 'Yetkili Kişi', 'info@forjetec.com', '', '', '', '', '', '', '', '', 'Türkiye', '', '', '', '', '', '', 'https://forjetec.com', '', '', '', '', '', 'active', 'normal', 'website', true, true, false, false, false, 'SiteGround Hosting - WordPress', '', NOW(), NOW()),
(1, 'Vuvita', 'Yetkili Kişi', 'info@vuvita.com', '', '', '', '', '', '', '', '', 'Türkiye', '', '', '', '', '', '', 'https://vuvita.com', '', '', '', '', '', 'active', 'normal', 'website', true, false, false, false, false, 'SiteGround Hosting', '', NOW(), NOW()),
(1, 'Kaza Tazminatiniz', 'Yetkili Kişi', 'info@kazatazminatiniz.com', '', '', '', '', '', '', '', '', 'Türkiye', '', '', '', '', '', '', 'https://kazatazminatiniz.com', '', '', '', '', '', 'active', 'normal', 'website', true, true, false, false, false, 'SiteGround Hosting - WordPress', '', NOW(), NOW()),
(1, 'Agabey Group', 'Yetkili Kişi', 'info@agabeygroup.com', '', '', '', '', '', '', '', '', 'Türkiye', '', '', '', '', '', '', 'https://agabeygroup.com', '', '', '', '', '', 'active', 'normal', 'website', true, true, false, false, false, 'SiteGround Hosting - WordPress', '', NOW(), NOW()),
(1, 'Mood Messe', 'Yetkili Kişi', 'info@moodmesse.com', '', '', '', '', '', '', '', '', 'Türkiye', '', '', '', '', '', '', 'https://moodmesse.com', '', '', '', '', '', 'active', 'normal', 'website', true, true, false, false, false, 'SiteGround Hosting - WordPress', '', NOW(), NOW()),
(1, 'Astra Voltrafo', 'Yetkili Kişi', 'info@astravoltrafo.com.tr', '', '', '', '', '', '', '', '', 'Türkiye', '', '', '', '', '', '', 'https://astravoltrafo.com.tr', '', '', '', '', '', 'active', 'normal', 'website', true, true, false, false, false, 'SiteGround Hosting - WordPress', '', NOW(), NOW()),
(1, 'Mood Expo', 'Yetkili Kişi', 'info@mood-expo.com', '', '', '', '', '', '', '', '', 'Türkiye', '', '', '', '', '', '', 'https://mood-expo.com', '', '', '', '', '', 'active', 'normal', 'website', true, true, false, false, false, 'SiteGround Hosting - WordPress', '', NOW(), NOW()),
(1, 'Eis Group', 'Yetkili Kişi', 'info@eisgroup.com.tr', '', '', '', '', '', '', '', '', 'Türkiye', '', '', '', '', '', '', 'https://eisgroup.com.tr', '', '', '', '', '', 'active', 'normal', 'website', true, true, false, false, false, 'SiteGround Hosting - WordPress', '', NOW(), NOW()),
(1, 'Zeya Mühendislik', 'Yetkili Kişi', 'info@zeyamuhendislik.com.tr', '', '', '', '', '', '', '', '', 'Türkiye', '', '', '', '', '', '', 'https://zeyamuhendislik.com.tr', '', '', '', '', '', 'active', 'normal', 'website', true, true, false, false, false, 'SiteGround Hosting - WordPress', '', NOW(), NOW()),
(1, 'Emrullah Koroğlu', 'Yetkili Kişi', 'info@emrullahkoroglu.com', '', '', '', '', '', '', '', '', 'Türkiye', '', '', '', '', '', '', 'https://emrullahkoroglu.com', '', '', '', '', '', 'active', 'normal', 'website', true, false, false, false, false, 'SiteGround Hosting', '', NOW(), NOW()),
(1, 'UDS Pergola Cam Sistemleri', 'Yetkili Kişi', 'info@udspergolacamsistemleri.com', '', '', '', '', '', '', '', '', 'Türkiye', '', '', '', '', '', '', 'https://udspergolacamsistemleri.com', '', '', '', '', '', 'active', 'normal', 'website', true, true, false, false, false, 'SiteGround Hosting - WordPress', '', NOW(), NOW()),
(1, 'Rezonall', 'Yetkili Kişi', 'info@rezonall.com', '', '', '', '', '', '', '', '', 'Türkiye', '', '', '', '', '', '', 'https://rezonall.com', '', '', '', '', '', 'active', 'normal', 'website', true, false, false, false, false, 'SiteGround Hosting', '', NOW(), NOW()),
(1, 'Tangül Doğalgaz Sıhhi Tesisatçım', 'Yetkili Kişi', 'info@tanguldogalgazsihhitesisatcim.com.tr', '', '', '', '', '', '', '', '', 'Türkiye', '', '', '', '', '', '', 'https://tanguldogalgazsihhitesisatcim.com.tr', '', '', '', '', '', 'active', 'normal', 'website', true, true, false, false, false, 'SiteGround Hosting - WordPress', '', NOW(), NOW()),
(1, 'En Yakın Elektrikçi 724', 'Yetkili Kişi', 'info@enyakinelektrikci724.com', '', '', '', '', '', '', '', '', 'Türkiye', '', '', '', '', '', '', 'https://enyakinelektrikci724.com', '', '', '', '', '', 'active', 'normal', 'website', true, true, false, false, false, 'SiteGround Hosting - WordPress', '', NOW(), NOW()),
(1, 'Devin Yangın', 'Yetkili Kişi', 'info@devinyangin.com.tr', '', '', '', '', '', '', '', '', 'Türkiye', '', '', '', '', '', '', 'https://devinyangin.com.tr', '', '', '', '', '', 'active', 'normal', 'website', true, false, false, false, false, 'SiteGround Hosting', '', NOW(), NOW());

-- Eklenen kayıtları kontrol et
SELECT id, company_name, website, has_hosting_service FROM customers ORDER BY id DESC LIMIT 20;
