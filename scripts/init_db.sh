#!/bin/bash
cd ../backend
source venv/bin/activate

echo "Running migrations..."
python manage.py migrate

echo "Creating permissions..."
python manage.py shell << END
from apps.accounts.models import Permission

perms = [
    ('customers.view', 'Müşterileri Görüntüle', 'customers'),
    ('customers.create', 'Müşteri Ekle', 'customers'),
    ('customers.edit', 'Müşteri Düzenle', 'customers'),
    ('customers.delete', 'Müşteri Sil', 'customers'),
    ('vault.view', 'Kasayı Görüntüle', 'vault'),
    ('vault.view_password', 'Şifre Göster', 'vault'),
    ('finance.view', 'Finansları Görüntüle', 'finance'),
    ('projects.view', 'Projeleri Görüntüle', 'projects'),
    ('tasks.view', 'Görevleri Görüntüle', 'tasks'),
    ('files.view', 'Dosyaları Görüntüle', 'files'),
]

for code, name, module in perms:
    Permission.objects.get_or_create(code=code, defaults={'name': name, 'module': module})

print(f"Created {len(perms)} permissions")
END

echo "Done!"
