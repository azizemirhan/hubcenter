from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BankAccountViewSet, InvoiceViewSet, IncomeViewSet, ExpenseViewSet

router = DefaultRouter()
router.register(r'bank-accounts', BankAccountViewSet)
router.register(r'invoices', InvoiceViewSet)
router.register(r'incomes', IncomeViewSet)
router.register(r'expenses', ExpenseViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
