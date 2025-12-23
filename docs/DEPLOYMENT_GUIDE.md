# 🚀 Hetzner Sunucu Kurulum ve CI/CD Deployment Rehberi

## hubcenter.nextmedya.com 🔧

---

## 📋 Sunucu Bilgileri

| Bilgi      | Değer                                    |
| ---------- | ---------------------------------------- |
| **IP**     | 157.180.74.158                           |
| **Domain** | hubcenter.nextmedya.com                  |
| **OS**     | Ubuntu 22.04 (önerilen)                  |
| **GitHub** | https://github.com/azizemirhan/hubcenter |

---

## 1️⃣ Sunucu İlk Kurulum

### SSH ile Sunucuya Bağlan

```bash
ssh root@157.180.74.158
```

### Sistem Güncellemesi

```bash
apt update && apt upgrade -y
```

### Docker Kurulumu

```bash
# Docker GPG key
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Docker Compose
apt install docker-compose-plugin -y

# Servis kontrolü
systemctl enable docker
systemctl start docker

# Versiyon kontrolü
docker --version
docker compose version
```

### Git Kurulumu

```bash
apt install git -y
```

---

## 2️⃣ Proje Klonlama

```bash
cd /root
git clone https://github.com/azizemirhan/hubcenter.git
cd hubcenter
```

---

## 3️⃣ Environment Dosyası Oluşturma

```bash
cd docker
nano .env
```

**.env içeriği:**

```env
DB_NAME=crm_db
DB_USER=postgres
DB_PASSWORD=GucluBirSifre123!
SECRET_KEY=django-insecure-uretilmis-guclu-key-buraya
VAULT_ENCRYPTION_KEY=32karakterlikguclubirkey12345678
DJANGO_ALLOWED_HOSTS=hubcenter.nextmedya.com,localhost
CORS_ALLOWED_ORIGINS=https://hubcenter.nextmedya.com
NEXT_PUBLIC_API_URL=https://hubcenter.nextmedya.com/api/v1
```

> ⚠️ **ÖNEMLİ**: Şifreleri güçlü ve benzersiz yapın!

---

## 4️⃣ İlk Çalıştırma

```bash
cd /root/hubcenter/docker

# Build ve başlat
docker compose -f docker-compose.prod.yml up -d --build

# Logları kontrol et
docker compose -f docker-compose.prod.yml logs -f

# Migrations
docker compose -f docker-compose.prod.yml exec backend python manage.py migrate

# Superuser oluştur
docker compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

---

## 5️⃣ Cloudflare DNS Ayarları

Cloudflare Dashboard'da:

1. **DNS** → **Add record**
2. Ayarlar:

   - **Type**: A
   - **Name**: hubcenter
   - **IPv4 address**: 157.180.74.158
   - **Proxy status**: ✅ Proxied (turuncu bulut)
   - **TTL**: Auto

3. **SSL/TLS** → **Overview** → **Full** seçin

---

## 6️⃣ GitHub Actions Secrets

GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret Name   | Değer                                   |
| ------------- | --------------------------------------- |
| `HOST`        | `157.180.74.158`                        |
| `USERNAME`    | `root`                                  |
| `SSH_KEY`     | Private SSH key (aşağıda oluşturulacak) |
| `DB_PASSWORD` | PostgreSQL şifresi                      |
| `SECRET_KEY`  | Django secret key                       |
| `VAULT_KEY`   | Vault encryption key                    |

### SSH Key Oluşturma (Sunucuda)

```bash
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_deploy -N ""

# Public key'i authorized_keys'e ekle
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys

# Private key'i GitHub'a ekle
cat ~/.ssh/github_deploy
```

Bu private key'i GitHub Secrets'a `SSH_KEY` olarak ekleyin.

---

## 7️⃣ Test

Site kontrolleri:

```bash
# Health check
curl https://hubcenter.nextmedya.com/health

# API kontrol
curl https://hubcenter.nextmedya.com/api/v1/

# Docker durumu
docker compose -f docker-compose.prod.yml ps
```

---

## 🔄 CI/CD Akışı

1. Lokal'de kod geliştir
2. `git push origin main`
3. GitHub Actions otomatik tetiklenir
4. Sunucuya SSH ile bağlanır
5. `git pull` yapar
6. Docker'ı rebuild eder
7. Site güncellenir! ✨

---

## 🔧 Faydalı Komutlar

```bash
# Container durumu
docker compose -f docker-compose.prod.yml ps

# Loglar
docker compose -f docker-compose.prod.yml logs -f

# Backend logları
docker compose -f docker-compose.prod.yml logs -f backend

# Restart
docker compose -f docker-compose.prod.yml restart

# Tamamen durdur
docker compose -f docker-compose.prod.yml down

# Rebuild
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 🆘 Sorun Giderme

| Sorun                    | Çözüm                                         |
| ------------------------ | --------------------------------------------- |
| 502 Bad Gateway          | Docker container'ları kontrol et: `docker ps` |
| Database bağlantı hatası | `.env` dosyasını kontrol et                   |
| Permission denied        | `chmod 600 ~/.ssh/github_deploy`              |
| Disk dolu                | `docker system prune -a`                      |

---

_Son güncelleme: 23 Aralık 2024_
