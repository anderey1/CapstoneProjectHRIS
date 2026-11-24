"""Local development settings."""

from .base import *  # noqa: F401,F403

# Development only. Configure a private SECRET_KEY before deploying.
SECRET_KEY = '@))qg#*#tk5+$o%zwp!-r&ragsg(zlke-vz2!y^3(li+km8@$r'

DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '[::1]']

CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
