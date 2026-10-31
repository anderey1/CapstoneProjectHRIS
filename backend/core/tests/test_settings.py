import os
import subprocess
import sys
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[2]


def run_manage(*args, **overrides):
    environment = os.environ.copy()
    for name in (
        'DJANGO_ENV',
        'SECRET_KEY',
        'DEBUG',
        'ALLOWED_HOSTS',
        'SECURE_SSL_REDIRECT',
        'SESSION_COOKIE_SECURE',
        'CSRF_COOKIE_SECURE',
        'SECURE_HSTS_SECONDS',
        'SECURE_HSTS_INCLUDE_SUBDOMAINS',
        'SECURE_HSTS_PRELOAD',
    ):
        environment.pop(name, None)
    environment['PYTHON_DOTENV_DISABLED'] = 'true'
    environment.update(overrides)
    return subprocess.run(
        [sys.executable, 'manage.py', *args],
        cwd=BACKEND_DIR,
        env=environment,
        capture_output=True,
        text=True,
    )


def test_local_development_starts_without_environment_configuration():
    result = run_manage('check')

    assert result.returncode == 0, result.stderr


def test_local_http_and_frontend_work_without_environment_configuration():
    result = run_manage(
        'shell',
        '-c',
        "from django.conf import settings; "
        "from django.test import Client; "
        "assert settings.DEBUG; "
        "assert not settings.SESSION_COOKIE_SECURE; "
        "assert not settings.CSRF_COOKIE_SECURE; "
        "response = Client().get('/__settings_probe__', "
        "HTTP_HOST='localhost', HTTP_ORIGIN='http://localhost:5173'); "
        "assert response.status_code == 404, response.status_code; "
        "assert response['Access-Control-Allow-Origin'] == 'http://localhost:5173'",
    )

    assert result.returncode == 0, result.stderr
