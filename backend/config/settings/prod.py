"""Production settings for Render, Vercel, and Neon."""

import os

import dj_database_url
from django.core.exceptions import ImproperlyConfigured

from .base import *  # noqa: F401,F403


def _env_list(name):
    return [item.strip() for item in os.getenv(name, '').split(',') if item.strip()]


def _env_flag(name, default=False):
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in ('1', 'true', 'yes', 'on')


SECRET_KEY = os.getenv('SECRET_KEY')
if not SECRET_KEY:
    raise ImproperlyConfigured('SECRET_KEY is required in production')

DEBUG = False

ALLOWED_HOSTS = _env_list('ALLOWED_HOSTS')
render_hostname = os.getenv('RENDER_EXTERNAL_HOSTNAME')
if render_hostname and render_hostname not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(render_hostname)
if not ALLOWED_HOSTS:
    raise ImproperlyConfigured(
        'ALLOWED_HOSTS or RENDER_EXTERNAL_HOSTNAME is required in production'
    )

CORS_ALLOWED_ORIGINS = _env_list('CORS_ALLOWED_ORIGINS')

PORTAL_URL = os.getenv('PORTAL_URL', '').rstrip('/')
if not PORTAL_URL:
    raise ImproperlyConfigured('PORTAL_URL is required in production')

# Neon suspends idle computes, so health-check reused connections.
# Use the pooled DATABASE_URL for the app and the direct URL for migrations.
database_url = os.getenv('DATABASE_URL')
if not database_url:
    raise ImproperlyConfigured('DATABASE_URL is required in production')

DATABASES = {
    'default': dj_database_url.config(
        default=database_url,
        conn_max_age=300,
        conn_health_checks=True,
        disable_server_side_cursors=True,
        ssl_require=True,
    )
}

# Render terminates TLS before traffic reaches Django.
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = _env_flag('SECURE_SSL_REDIRECT', False)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

try:
    SECURE_HSTS_SECONDS = int(os.getenv('SECURE_HSTS_SECONDS', '0'))
except ValueError as exc:
    raise ImproperlyConfigured('SECURE_HSTS_SECONDS must be an integer') from exc
SECURE_HSTS_INCLUDE_SUBDOMAINS = _env_flag('SECURE_HSTS_INCLUDE_SUBDOMAINS', False)
SECURE_HSTS_PRELOAD = _env_flag('SECURE_HSTS_PRELOAD', False)
