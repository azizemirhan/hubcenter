# 🤖 Ollama AI - CRM/ERP Entegrasyon Planı

Bu doküman, Ollama AI'ın mevcut CRM/ERP sistemimize nasıl entegre edilebileceğini detaylı şekilde açıklar.

---

## 📋 İçindekiler

1. [Ollama Nedir?](#1-ollama-nedir)
2. [Sistem Modülleri ve AI Kullanım Alanları](#2-sistem-modülleri-ve-ai-kullanım-alanları)
3. [Teknik Entegrasyon](#3-teknik-entegrasyon)
4. [Öncelik Sıralaması](#4-öncelik-sıralaması)
5. [Kullanıcı Arayüzü](#5-kullanıcı-arayüzü)

---

## 1. Ollama Nedir?

**Ollama**, bilgisayarınızda yerel olarak çalışan açık kaynak AI platformudur.

### Avantajları

| Özellik                   | Açıklama                                         |
| ------------------------- | ------------------------------------------------ |
| 💰 **Ücretsiz**           | API maliyeti yok, limitsiz kullanım              |
| 🔒 **Gizlilik**           | Veriler bilgisayarınızda kalır, internete gitmez |
| ⚡ **Hızlı**              | İnternet gecikması yok                           |
| 🛠️ **Özelleştirilebilir** | Kendi modellerinizi eğitebilirsiniz              |

### Önerilen Modeller

- **llama3.2** (3GB) - Genel amaçlı, dengeli
- **mistral** (4GB) - Kod ve teknik içerik için iyi
- **phi3** (1.4GB) - Hafif, hızlı yanıtlar

---

## 2. Sistem Modülleri ve AI Kullanım Alanları

### 2.1 👥 Müşteriler (Customers)

| Özellik                   | AI Kullanımı                                                         | Öncelik |
| ------------------------- | -------------------------------------------------------------------- | ------- |
| **Müşteri Özeti**         | Tüm notları, faturaları, projeleri özetleyerek 2-3 cümlelik briefing | ⭐⭐⭐  |
| **Email Asistanı**        | Profesyonel email taslağı oluşturma                                  | ⭐⭐⭐  |
| **Hatırlatma Email'i**    | Sözleşme yenileme, ödeme hatırlatması                                | ⭐⭐    |
| **Müşteri Segmentasyonu** | Sektör, hizmet türüne göre otomatik etiketleme                       | ⭐      |
| **Churn Tahmini**         | Ayrılma riski olan müşterileri tespit                                | ⭐      |

**Örnek Prompt:**

```
Müşteri: Eis Gold (ID: 7)
- Hosting hizmeti alıyor
- Son iletişim: 15 gün önce
- Sözleşme bitiş: 2 ay sonra

Bu müşteriye sözleşme yenileme için profesyonel bir email yaz.
```

---

### 2.2 📊 Potansiyel Müşteriler (Leads)

| Özellik                  | AI Kullanımı                         | Öncelik |
| ------------------------ | ------------------------------------ | ------- |
| **Lead Skorlama**        | Dönüşüm olasılığını değerlendirme    | ⭐⭐⭐  |
| **Sonraki Adım Önerisi** | İletişim geçmişine göre ne yapılmalı | ⭐⭐⭐  |
| **Teklif Hazırlama**     | Otomatik teklif metni oluşturma      | ⭐⭐    |
| **Kayıp Analizi**        | Neden kaybedildi analizi ve öneriler | ⭐⭐    |

**Örnek Prompt:**

```
Lead: ABC Şirketi
Durum: Teklif Gönderildi
Aktiviteler:
- 1 hafta önce telefon görüşmesi yapıldı
- 3 gün önce teklif gönderildi
- Henüz cevap yok

Sonraki adım olarak ne yapmalıyız?
```

---

### 2.3 🔍 SEO Yönetimi

| Özellik                    | AI Kullanımı                        | Öncelik |
| -------------------------- | ----------------------------------- | ------- |
| **Anahtar Kelime Önerisi** | Sektöre göre anahtar kelime listesi | ⭐⭐⭐  |
| **Rapor Yorumlama**        | SEO raporu özeti ve müşteriye sunum | ⭐⭐⭐  |
| **İçerik Önerisi**         | Blog/makale konusu önerileri        | ⭐⭐    |
| **Meta Açıklama**          | SEO uyumlu meta description yazma   | ⭐⭐    |
| **Backlink Analizi**       | Rakip analizi ve öneriler           | ⭐      |

**Örnek Prompt:**

```
Müşteri: Kaza Tazminatiniz (Hukuk sektörü)
Hedef: Kaza tazminatı davalarından trafik çekmek

Bu müşteri için:
1. 10 adet anahtar kelime öner
2. Her birinin arama hacmi tahmini
3. 3 blog yazısı konusu öner
```

---

### 2.4 💰 Finans

| Özellik                 | AI Kullanımı                                | Öncelik |
| ----------------------- | ------------------------------------------- | ------- |
| **Fatura Hatırlatması** | Ödeme gecikmiş müşterilere nazik hatırlatma | ⭐⭐⭐  |
| **Nakit Akışı Tahmini** | Gelecek ay gelir/gider tahmini              | ⭐⭐    |
| **Gider Analizi**       | Gereksiz harcamaları tespit                 | ⭐      |
| **Fatura Açıklaması**   | Fatura kalemlerini açıklayan metin          | ⭐      |

**Örnek Prompt:**

```
Müşteri: Mood Expo
Fatura No: 2024-0123
Tutar: 5.000 TL
Vade: 15 gün geçmiş

Nazik ama kararlı bir ödeme hatırlatma mesajı yaz (WhatsApp için).
```

---

### 2.5 📁 Projeler ve Görevler

| Özellik              | AI Kullanımı                            | Öncelik |
| -------------------- | --------------------------------------- | ------- |
| **Proje Özeti**      | Proje durumu briefing'i                 | ⭐⭐    |
| **Görev Açıklaması** | Kısa görev başlığından detaylı açıklama | ⭐⭐    |
| **Tahmin Süresi**    | Görev için süre tahmini                 | ⭐      |
| **Stand-up Raporu**  | Günlük/haftalık özet                    | ⭐      |

**Örnek Prompt:**

```
Proje: EIS Gold Web Tasarım
Görevler:
- [x] Wireframe (tamamlandı)
- [ ] UI Tasarım (devam ediyor)
- [ ] Frontend Kodlama (beklemede)
- [ ] Backend Entegrasyon (beklemede)

Deadline: 15 Ocak 2025

Proje durumu hakkında müşteriye yollayacağımız kısa bir güncelleme metni yaz.
```

---

### 2.6 📝 Notlar ve İletişim

| Özellik             | AI Kullanımı                       | Öncelik |
| ------------------- | ---------------------------------- | ------- |
| **Not Özeti**       | Uzun notları kısa özete dönüştürme | ⭐⭐⭐  |
| **Toplantı Notu**   | Ham notlardan yapılandırılmış not  | ⭐⭐    |
| **Aksiyon Çıkarma** | Notlardan yapılacaklar listesi     | ⭐⭐    |

---

### 2.7 🔐 Kasa (Vault) - Şifre Yönetimi

| Özellik                  | AI Kullanımı                   | Öncelik |
| ------------------------ | ------------------------------ | ------- |
| **Güvenli Şifre Üretme** | Güçlü şifre oluşturma          | ⭐      |
| **Şifre Gücü Analizi**   | Mevcut şifreleri değerlendirme | ⭐      |

---

### 2.8 🌐 Domain & Hosting

| Özellik                   | AI Kullanımı                    | Öncelik |
| ------------------------- | ------------------------------- | ------- |
| **Yenileme Hatırlatması** | Domain/hosting yenileme email'i | ⭐⭐    |
| **SSL Durumu**            | Sertifika sorunları için uyarı  | ⭐      |

---

## 3. Teknik Entegrasyon

### 3.1 Backend API Endpoint

```python
# backend/apps/ai/views.py
import ollama
from rest_framework.views import APIView
from rest_framework.response import Response

class AIAssistantView(APIView):
    """Ollama AI asistan endpoint'i"""

    def post(self, request):
        prompt = request.data.get('prompt')
        context = request.data.get('context', '')
        action = request.data.get('action')  # email, summary, suggestion

        system_prompts = {
            'email': 'Sen profesyonel bir iş iletişimi asistanısın. Türkçe yaz.',
            'summary': 'Verilen bilgileri kısa ve öz şekilde özetle. Türkçe yaz.',
            'suggestion': 'Verilen duruma göre akıllıca önerilerde bulun. Türkçe yaz.',
        }

        response = ollama.chat(
            model='llama3.2',
            messages=[
                {'role': 'system', 'content': system_prompts.get(action, '')},
                {'role': 'user', 'content': f'{context}\n\n{prompt}'}
            ]
        )

        return Response({
            'result': response['message']['content'],
            'model': 'llama3.2'
        })
```

### 3.2 URL Yapılandırması

```python
# backend/apps/ai/urls.py
from django.urls import path
from .views import AIAssistantView

urlpatterns = [
    path('assistant/', AIAssistantView.as_view(), name='ai-assistant'),
]
```

### 3.3 Frontend Hook

```typescript
// frontend/src/hooks/useAI.ts
import { useState } from "react";
import { apiClient } from "@/lib/api";

interface AIRequest {
  prompt: string;
  context?: string;
  action: "email" | "summary" | "suggestion";
}

export function useAI() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const generate = async (request: AIRequest) => {
    setLoading(true);
    try {
      const response = await apiClient.post("/api/v1/ai/assistant/", request);
      setResult(response.data.result);
      return response.data.result;
    } finally {
      setLoading(false);
    }
  };

  return { generate, loading, result };
}
```

### 3.4 UI Komponenti

```tsx
// frontend/src/components/AIAssistant.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAI } from "@/hooks/useAI";
import { Sparkles, Loader2 } from "lucide-react";

interface Props {
  context?: string;
  action: "email" | "summary" | "suggestion";
  placeholder?: string;
  onResult?: (text: string) => void;
}

export function AIAssistant({ context, action, placeholder, onResult }: Props) {
  const [prompt, setPrompt] = useState("");
  const { generate, loading, result } = useAI();

  const handleGenerate = async () => {
    const text = await generate({ prompt, context, action });
    if (text && onResult) {
      onResult(text);
    }
  };

  return (
    <div className="space-y-3">
      <Textarea
        placeholder={placeholder || "Ne yapmamı istersin?"}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <Button onClick={handleGenerate} disabled={loading}>
        {loading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4 mr-2" />
        )}
        AI ile Oluştur
      </Button>
      {result && (
        <div className="p-4 bg-muted rounded-lg">
          <pre className="whitespace-pre-wrap text-sm">{result}</pre>
        </div>
      )}
    </div>
  );
}
```

---

## 4. Öncelik Sıralaması

### Faz 1: Temel Özellikler (1-2 hafta)

- [ ] Ollama backend entegrasyonu
- [ ] Email asistanı (müşteri/lead için)
- [ ] Not özeti

### Faz 2: İş Zekası (2-3 hafta)

- [ ] SEO anahtar kelime önerisi
- [ ] Lead skorlama ve sonraki adım önerisi
- [ ] Fatura hatırlatma mesajları

### Faz 3: Gelişmiş Özellikler (1 ay+)

- [ ] Müşteri churn tahmini
- [ ] Nakit akışı tahmini
- [ ] Proje süresi tahmini
- [ ] Akıllı arama (doğal dil sorgusu)

---

## 5. Kullanıcı Arayüzü

### 5.1 Global AI Butonu

Her sayfada sağ alt köşede sabit bir "✨ AI Asistan" butonu.
Tıklandığında sliding panel açılır.

### 5.2 Modül İçi AI

- Müşteri detay sayfasında "AI ile Email Yaz" butonu
- Lead sayfasında "Sonraki Adım Öner" butonu
- SEO sayfasında "Anahtar Kelime Öner" butonu
- Finans sayfasında "Hatırlatma Yaz" butonu

### 5.3 Klavye Kısayolu

`Ctrl/Cmd + K` ile hızlı AI erişimi

---

## 6. Sonuç

Ollama entegrasyonu ile CRM/ERP sisteminiz:

- 📧 Otomatik email ve mesaj oluşturabilir
- 📊 Verileri anlamlı özetlere dönüştürebilir
- 💡 Akıllı önerilerde bulunabilir
- ⏱️ Çalışan verimliliğini artırabilir

**Tahmini geliştirme süresi:** 3-4 hafta (tüm fazlar)

---

_Bu doküman 22 Aralık 2024 tarihinde oluşturulmuştur._
