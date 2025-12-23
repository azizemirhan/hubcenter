from django.db import models
from core.models import AuditableModel

class BankAccount(AuditableModel):
    bank_name = models.CharField(max_length=100)
    account_name = models.CharField(max_length=255)
    iban = models.CharField(max_length=34)
    currency = models.CharField(max_length=3, default='TRY')
    current_balance = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'bank_accounts'


class BankCard(AuditableModel):
    CARD_TYPES = [('debit', 'Banka Kartı'), ('credit', 'Kredi Kartı'), ('virtual', 'Sanal Kart')]
    bank_account = models.ForeignKey(BankAccount, on_delete=models.CASCADE, related_name='cards')
    card_name = models.CharField(max_length=100)
    card_number_last4 = models.CharField(max_length=4)
    card_type = models.CharField(max_length=10, choices=CARD_TYPES)
    expire_date = models.DateField(null=True, blank=True)
    credit_limit = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'bank_cards'


class CashBalance(AuditableModel):
    title = models.CharField(max_length=100, default='Kasa')
    amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default='TRY')
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'cash_balances'


class Invoice(AuditableModel):
    STATUS_CHOICES = [('draft', 'Taslak'), ('sent', 'Gönderildi'), ('paid', 'Ödendi'), ('partial', 'Kısmi Ödeme'), ('overdue', 'Gecikmiş'), ('cancelled', 'İptal')]

    customer = models.ForeignKey('customers.Customer', on_delete=models.CASCADE, related_name='invoices')
    invoice_no = models.CharField(max_length=50)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=20)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default='TRY')
    issue_date = models.DateField()
    due_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    description = models.TextField(blank=True)
    pdf_file = models.FileField(upload_to='invoices/', blank=True, null=True)
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    paid_date = models.DateField(null=True, blank=True)

    class Meta:
        db_table = 'invoices'
        ordering = ['-issue_date']


class Income(AuditableModel):
    PAYMENT_METHODS = [('cash', 'Nakit'), ('bank_transfer', 'Havale/EFT'), ('credit_card', 'Kredi Kartı'), ('check', 'Çek')]

    customer = models.ForeignKey('customers.Customer', on_delete=models.CASCADE, related_name='incomes', null=True, blank=True)
    invoice = models.ForeignKey(Invoice, on_delete=models.SET_NULL, null=True, blank=True, related_name='payments')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default='TRY')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    bank_account = models.ForeignKey(BankAccount, on_delete=models.SET_NULL, null=True, blank=True)
    received_date = models.DateField()
    description = models.TextField(blank=True)

    class Meta:
        db_table = 'incomes'
        ordering = ['-received_date']


class Expense(AuditableModel):
    PERIOD_CHOICES = [('once', 'Tek Seferlik'), ('monthly', 'Aylık'), ('yearly', 'Yıllık')]
    CATEGORY_CHOICES = [
        ('rent', 'Kira'), ('utilities', 'Faturalar'), ('salary', 'Maaş'), ('software', 'Yazılım/Abonelik'),
        ('hardware', 'Donanım'), ('marketing', 'Pazarlama'), ('domain_hosting', 'Domain/Hosting'),
        ('office', 'Ofis Giderleri'), ('tax', 'Vergi'), ('other', 'Diğer')
    ]

    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default='TRY')
    period_type = models.CharField(max_length=10, choices=PERIOD_CHOICES, default='once')
    payment_day = models.PositiveIntegerField(null=True, blank=True)
    card = models.ForeignKey(BankCard, on_delete=models.SET_NULL, null=True, blank=True, related_name='expenses')
    bank_account = models.ForeignKey(BankAccount, on_delete=models.SET_NULL, null=True, blank=True, related_name='expenses')
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'expenses'
        ordering = ['-created_at']
