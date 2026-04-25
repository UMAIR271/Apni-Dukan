"""
Django settings for apni_dukan project.

All sensitive settings are read from environment variables.
Local dev uses sane defaults so the project still runs out-of-the-box.
"""

from pathlib import Path
import os
import dj_database_url


BASE_DIR = Path(__file__).resolve().parent.parent


def env_bool(name: str, default: bool) -> bool:
    return os.environ.get(name, str(default)).lower() in ('1', 'true', 'yes', 'on')


def env_list(name: str, default: str) -> list[str]:
    raw = os.environ.get(name, default)
    return [item.strip() for item in raw.split(',') if item.strip()]


# SECURITY -------------------------------------------------------------------

SECRET_KEY = os.environ.get(
    'SECRET_KEY',
    'django-insecure-change-this-in-production-!@#$%^&*()',
)

DEBUG = env_bool('DEBUG', True)

ALLOWED_HOSTS = env_list('ALLOWED_HOSTS', 'localhost,127.0.0.1,.onrender.com')


# Application definition -----------------------------------------------------

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'cloudinary_storage',
    'cloudinary',
    'store',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'apni_dukan.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'apni_dukan.wsgi.application'


# Database -------------------------------------------------------------------
# Reads DATABASE_URL (e.g. Neon / Supabase / Render Postgres) when present,
# otherwise falls back to local SQLite.

DATABASE_URL = os.environ.get('DATABASE_URL')
if DATABASE_URL:
    DATABASES = {
        'default': dj_database_url.parse(
            DATABASE_URL, conn_max_age=600, ssl_require=True
        )
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }


# Password validation --------------------------------------------------------

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]


# Internationalization -------------------------------------------------------

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True


# Static & media -------------------------------------------------------------

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

# When CLOUDINARY_URL is set in the environment, push uploads to Cloudinary
# instead of the local filesystem (free tier hosts have ephemeral disks).
if os.environ.get('CLOUDINARY_URL'):
    DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# REST Framework -------------------------------------------------------------

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}


# Cache ----------------------------------------------------------------------
# Local-memory cache by default. Free, in-process, no extra service required.
# Set REDIS_URL env var if you want distributed caching across workers.

REDIS_URL = os.environ.get('REDIS_URL', '')
if REDIS_URL:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.redis.RedisCache',
            'LOCATION': REDIS_URL,
            'TIMEOUT': 300,
        }
    }
else:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'apni-dukan-default',
            'TIMEOUT': 300,
        }
    }


# Rate limiting --------------------------------------------------------------
# django-ratelimit configuration. Disable in DEBUG so dev work isn't blocked.

RATELIMIT_ENABLE = env_bool('RATELIMIT_ENABLE', not DEBUG)
RATELIMIT_USE_CACHE = 'default'


# CORS -----------------------------------------------------------------------

CORS_ALLOWED_ORIGINS = env_list(
    'CORS_ALLOWED_ORIGINS',
    'http://localhost:3000,http://localhost:8000',
)

CORS_ALLOWED_ORIGIN_REGEXES = env_list(
    'CORS_ALLOWED_ORIGIN_REGEXES',
    r'^https://.*\.vercel\.app$',
)

CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = env_list(
    'CSRF_TRUSTED_ORIGINS',
    'http://localhost:3000,https://*.onrender.com,https://*.vercel.app',
)


# Production hardening -------------------------------------------------------

if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_SSL_REDIRECT = env_bool('SECURE_SSL_REDIRECT', True)
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 60 * 60 * 24 * 30  # 30 days
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_CONTENT_TYPE_NOSNIFF = True


# Business rules -------------------------------------------------------------

# Retail (regular customer) order rules
RETAIL_MIN_ORDER = int(os.environ.get('RETAIL_MIN_ORDER', 800))
RETAIL_FREE_DELIVERY_THRESHOLD = int(os.environ.get('RETAIL_FREE_DELIVERY_THRESHOLD', 5000))
RETAIL_DELIVERY_FEE = int(os.environ.get('RETAIL_DELIVERY_FEE', 100))

# Wholesale order rules
WHOLESALE_MIN_ORDER = int(os.environ.get('WHOLESALE_MIN_ORDER', 3000))

# Stock alerts
LOW_STOCK_THRESHOLD = int(os.environ.get('LOW_STOCK_THRESHOLD', 5))


# Site / SEO -----------------------------------------------------------------

SITE_NAME = os.environ.get('SITE_NAME', 'Apni Dukan')
# Used by sitemap.xml and absolute URLs in metadata. No trailing slash.
SITE_URL = os.environ.get('SITE_URL', 'http://localhost:3000').rstrip('/')


# Email ----------------------------------------------------------------------
# Console backend in dev (prints to terminal). SMTP backend in prod when
# EMAIL_HOST_USER + EMAIL_HOST_PASSWORD are set.

EMAIL_BACKEND = os.environ.get(
    'EMAIL_BACKEND',
    'django.core.mail.backends.console.EmailBackend' if DEBUG
    else 'django.core.mail.backends.smtp.EmailBackend',
)
EMAIL_HOST = os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT', 587))
EMAIL_USE_TLS = env_bool('EMAIL_USE_TLS', True)
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.environ.get(
    'DEFAULT_FROM_EMAIL',
    f'Apni Dukan <{EMAIL_HOST_USER or "noreply@apni-dukan.local"}>',
)
ORDER_NOTIFICATION_EMAIL = os.environ.get('ORDER_NOTIFICATION_EMAIL', '')
