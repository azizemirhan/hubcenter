import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from django.conf import settings

def get_fernet():
    key = settings.VAULT_ENCRYPTION_KEY.encode()
    kdf = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=b'crm_erp_vault', iterations=100000)
    return Fernet(base64.urlsafe_b64encode(kdf.derive(key)))

def encrypt_password(password: str) -> str:
    return get_fernet().encrypt(password.encode()).decode()

def decrypt_password(encrypted: str) -> str:
    return get_fernet().decrypt(encrypted.encode()).decode()
