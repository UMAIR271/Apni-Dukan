"""SEO endpoints: sitemap.xml and robots.txt.

These use the public frontend URL configured via SITE_URL so search engines
can crawl the storefront, not the API server.
"""
from django.conf import settings
from django.http import HttpResponse
from django.utils.xmlutils import SimplerXMLGenerator

from .models import Category, Product


def _site_url():
    return getattr(settings, 'SITE_URL', 'http://localhost:3000').rstrip('/')


def sitemap_xml(request):
    """Generate a sitemap.xml of public storefront URLs."""

    site = _site_url()
    response = HttpResponse(content_type='application/xml')
    xml = SimplerXMLGenerator(response, 'utf-8')
    xml.startDocument()
    xml.startElement('urlset', {'xmlns': 'http://www.sitemaps.org/schemas/sitemap/0.9'})

    def add_url(loc, lastmod=None, priority=None, changefreq=None):
        xml.startElement('url', {})
        xml.startElement('loc', {})
        xml.characters(loc)
        xml.endElement('loc')
        if lastmod:
            xml.startElement('lastmod', {})
            xml.characters(lastmod.strftime('%Y-%m-%d'))
            xml.endElement('lastmod')
        if changefreq:
            xml.startElement('changefreq', {})
            xml.characters(changefreq)
            xml.endElement('changefreq')
        if priority:
            xml.startElement('priority', {})
            xml.characters(priority)
            xml.endElement('priority')
        xml.endElement('url')

    add_url(f'{site}/', priority='1.0', changefreq='daily')
    add_url(f'{site}/products', priority='0.9', changefreq='daily')
    add_url(f'{site}/wholesale', priority='0.7', changefreq='weekly')

    for category in Category.objects.filter(is_active=True).only('slug'):
        add_url(f'{site}/category/{category.slug}', priority='0.8', changefreq='weekly')

    for product in Product.objects.filter(is_active=True).only('id', 'created_at'):
        add_url(
            f'{site}/product/{product.id}',
            lastmod=product.created_at,
            priority='0.6',
            changefreq='weekly',
        )

    xml.endElement('urlset')
    xml.endDocument()
    return response


def robots_txt(request):
    site = _site_url()
    body = (
        "User-agent: *\n"
        "Disallow: /admin/\n"
        "Disallow: /api/\n"
        "Allow: /\n"
        f"Sitemap: {site}/sitemap.xml\n"
    )
    return HttpResponse(body, content_type='text/plain')
