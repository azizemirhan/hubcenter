from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/v1/auth/', include('apps.accounts.urls')),
    path('api/v1/organization/', include('apps.organization.urls')),
    path('api/v1/customers/', include('apps.customers.urls')),
    path('api/v1/leads/', include('apps.leads.urls')),
    path('api/v1/domains/', include('apps.domains.urls')),
    path('api/v1/vault/', include('apps.vault.urls')),
    path('api/v1/projects/', include('apps.projects.urls')),
    path('api/v1/tasks/', include('apps.tasks.urls')),
    path('api/v1/finance/', include('apps.finance.urls')),
    path('api/v1/files/', include('apps.files.urls')),
    path('api/v1/seo/', include('apps.seo.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
