from rest_framework import serializers
from .models import BankAccount, BankCard, CashBalance, Invoice, Income, Expense


class BankCardSerializer(serializers.ModelSerializer):
    card_type_display = serializers.CharField(source='get_card_type_display', read_only=True)

    class Meta:
        model = BankCard
        fields = ['id', 'bank_account', 'card_name', 'card_number_last4', 
                  'card_type', 'card_type_display', 'expire_date', 'credit_limit', 'is_active']


class BankAccountSerializer(serializers.ModelSerializer):
    cards = BankCardSerializer(many=True, read_only=True)

    class Meta:
        model = BankAccount
        fields = ['id', 'bank_name', 'account_name', 'iban', 'currency',
                  'current_balance', 'is_active', 'notes', 'cards', 'created_at']


class CashBalanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = CashBalance
        fields = ['id', 'title', 'amount', 'currency', 'notes', 'created_at']


class InvoiceSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.company_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    remaining_amount = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = [
            'id', 'customer', 'customer_name', 'invoice_no', 'amount',
            'tax_rate', 'tax_amount', 'total_amount', 'currency',
            'issue_date', 'due_date', 'status', 'status_display',
            'description', 'pdf_file', 'paid_amount', 'paid_date',
            'remaining_amount', 'created_at'
        ]
        read_only_fields = ['id', 'customer_name', 'status_display', 'remaining_amount', 'created_at']

    def get_remaining_amount(self, obj):
        return float(obj.total_amount - obj.paid_amount)


class InvoiceListSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.company_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Invoice
        fields = ['id', 'customer', 'customer_name', 'invoice_no', 'total_amount',
                  'currency', 'issue_date', 'due_date', 'status', 'status_display', 'paid_amount']


class IncomeSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.company_name', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    bank_name = serializers.CharField(source='bank_account.bank_name', read_only=True)

    class Meta:
        model = Income
        fields = [
            'id', 'customer', 'customer_name', 'invoice', 'amount', 'currency',
            'payment_method', 'payment_method_display', 'bank_account', 'bank_name',
            'received_date', 'description', 'created_at'
        ]
        read_only_fields = ['id', 'customer_name', 'payment_method_display', 'bank_name', 'created_at']


class ExpenseSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    period_type_display = serializers.CharField(source='get_period_type_display', read_only=True)

    class Meta:
        model = Expense
        fields = [
            'id', 'category', 'category_display', 'title', 'description',
            'amount', 'currency', 'period_type', 'period_type_display',
            'payment_day', 'card', 'bank_account', 'start_date', 'end_date',
            'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'category_display', 'period_type_display', 'created_at']


class ExpenseListSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    period_type_display = serializers.CharField(source='get_period_type_display', read_only=True)

    class Meta:
        model = Expense
        fields = ['id', 'category', 'category_display', 'title', 'amount',
                  'currency', 'period_type', 'period_type_display', 'start_date', 'is_active']
