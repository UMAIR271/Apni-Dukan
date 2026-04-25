"""
URL configuration for apni_dukan project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from store.seo import sitemap_xml, robots_txt

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('store.urls')),
    path('sitemap.xml', sitemap_xml, name='sitemap'),
    path('robots.txt', robots_txt, name='robots'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
