from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum
from django.utils import timezone
from datetime import timedelta
from .models import BankAccount, BankCard, CashBalance, Invoice, Income, Expense
from .serializers import (
    BankAccountSerializer, BankCardSerializer, CashBalanceSerializer,
    InvoiceSerializer, InvoiceListSerializer, IncomeSerializer, 
    ExpenseSerializer, ExpenseListSerializer
)


class BankAccountViewSet(viewsets.ModelViewSet):
    queryset = BankAccount.objects.all()
    serializer_class = BankAccountSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return BankAccount.objects.all()
        active_company = user.active_company
        if active_company:
            return BankAccount.objects.filter(company=active_company)
        return BankAccount.objects.none()

    def perform_create(self, serializer):
        serializer.save(company=self.request.user.active_company, created_by=self.request.user)


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['customer', 'status']
    search_fields = ['invoice_no', 'customer__company_name']
    ordering_fields = ['issue_date', 'due_date', 'total_amount']
    ordering = ['-issue_date']

    def get_serializer_class(self):
        if self.action == 'list':
            return InvoiceListSerializer
        return InvoiceSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Invoice.objects.select_related('customer').all()
        active_company = user.active_company
        if active_company:
            return Invoice.objects.select_related('customer').filter(company=active_company)
        return Invoice.objects.none()

    def perform_create(self, serializer):
        # Calculate tax and total
        amount = serializer.validated_data.get('amount', 0)
        tax_rate = serializer.validated_data.get('tax_rate', 20)
        tax_amount = amount * tax_rate / 100
        total_amount = amount + tax_amount
        
        serializer.save(
            company=self.request.user.active_company,
            created_by=self.request.user,
            tax_amount=tax_amount,
            total_amount=total_amount
        )

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get invoice statistics"""
        queryset = self.get_queryset()
        today = timezone.now().date()
        
        total_amount = queryset.aggregate(total=Sum('total_amount'))['total'] or 0
        paid_amount = queryset.aggregate(total=Sum('paid_amount'))['total'] or 0
        
        summary = {
            'total_invoices': queryset.count(),
            'draft': queryset.filter(status='draft').count(),
            'sent': queryset.filter(status='sent').count(),
            'paid': queryset.filter(status='paid').count(),
            'overdue': queryset.filter(status='overdue').count(),
            'total_amount': float(total_amount),
            'paid_amount': float(paid_amount),
            'pending_amount': float(total_amount - paid_amount),
        }
        return Response(summary)

    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        """Mark invoice as fully paid"""
        invoice = self.get_object()
        invoice.status = 'paid'
        invoice.paid_amount = invoice.total_amount
        invoice.paid_date = timezone.now().date()
        invoice.save()
        return Response({'status': 'success'})


class IncomeViewSet(viewsets.ModelViewSet):
    queryset = Income.objects.all()
    serializer_class = IncomeSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['customer', 'payment_method', 'bank_account']
    ordering = ['-received_date']

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Income.objects.select_related('customer', 'bank_account').all()
        active_company = user.active_company
        if active_company:
            return Income.objects.select_related('customer', 'bank_account').filter(company=active_company)
        return Income.objects.none()

    def perform_create(self, serializer):
        serializer.save(company=self.request.user.active_company, created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get income statistics by period"""
        queryset = self.get_queryset()
        today = timezone.now().date()
        
        # This month
        month_start = today.replace(day=1)
        this_month = queryset.filter(received_date__gte=month_start).aggregate(total=Sum('amount'))['total'] or 0
        
        # This year
        year_start = today.replace(month=1, day=1)
        this_year = queryset.filter(received_date__gte=year_start).aggregate(total=Sum('amount'))['total'] or 0
        
        summary = {
            'total_records': queryset.count(),
            'this_month': float(this_month),
            'this_year': float(this_year),
        }
        return Response(summary)


class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'period_type', 'is_active']
    search_fields = ['title', 'description']
    ordering = ['-start_date']

    def get_serializer_class(self):
        if self.action == 'list':
            return ExpenseListSerializer
        return ExpenseSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Expense.objects.all()
        active_company = user.active_company
        if active_company:
            return Expense.objects.filter(company=active_company)
        return Expense.objects.none()

    def perform_create(self, serializer):
        serializer.save(company=self.request.user.active_company, created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get expense statistics"""
        queryset = self.get_queryset()
        
        # Monthly recurring
        monthly = queryset.filter(period_type='monthly', is_active=True).aggregate(total=Sum('amount'))['total'] or 0
        
        # One-time expenses this month
        today = timezone.now().date()
        month_start = today.replace(day=1)
        one_time = queryset.filter(period_type='once', start_date__gte=month_start).aggregate(total=Sum('amount'))['total'] or 0
        
        # By category
        by_category = {}
        for exp in queryset.filter(is_active=True):
            cat = exp.get_category_display()
            by_category[cat] = by_category.get(cat, 0) + float(exp.amount)
        
        summary = {
            'total_records': queryset.count(),
            'monthly_recurring': float(monthly),
            'one_time_this_month': float(one_time),
            'by_category': by_category,
        }
        return Response(summary)
