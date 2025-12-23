# CRM/ERP Sistemi

Holding/Grup yapısı destekli, multi-tenant CRM/ERP sistemi.

## Özellikler

- 🏢 Multi-tenant (Holding > Ana Şirket > Alt Şirket)
- 👥 Müşteri ve Potansiyel Müşteri Yönetimi
- 🌐 Domain & Hosting Takibi
- 🔐 Güvenli Şifre Kasası (AES-256)
- 📊 Proje & Görev Yönetimi (Kanban, Time Tracking)
- 💰 Finans Yönetimi
- 📁 Dosya Yönetimi
- 📱 WhatsApp Entegrasyonu
- 🔔 Bildirim Sistemi
- 📝 Audit Log

## Teknolojiler

- Backend: Django 5 + DRF
- Frontend: Next.js 14 + React
- Mobile: React Native (Expo)
- Database: PostgreSQL
- Cache: Redis
- Task Queue: Celery

## Kurulum

### Docker ile (Önerilen)

```bash
cd docker
docker-compose up -d
```

### Manuel

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements/development.txt
cp .env.example .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## API Docs

http://localhost:8000/api/docs/
