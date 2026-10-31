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


def test_missing_environment_fails_closed():
    result = run_manage('check')

    assert result.returncode != 0
    assert 'SECRET_KEY must be set when DJANGO_ENV is production.' in result.stderr


def test_debug_true_without_django_env_allows_local_development():
    result = run_manage('check', DEBUG='True')

    assert result.returncode == 0, result.stderr


def test_production_without_secret_key_fails_closed():
    result = run_manage('check', DJANGO_ENV='production', DEBUG='False')

    assert result.returncode != 0
    assert 'SECRET_KEY must be set when DJANGO_ENV is production.' in result.stderr


def test_production_with_valid_configuration_passes_deploy_checks():
    result = run_manage(
        'check',
        '--deploy',
        DJANGO_ENV='production',
        DEBUG='False',
        SECRET_KEY='aB3!x' * 12,
        ALLOWED_HOSTS='localhost',
        SECURE_SSL_REDIRECT='True',
        SESSION_COOKIE_SECURE='True',
        CSRF_COOKIE_SECURE='True',
        SECURE_HSTS_SECONDS='31536000',
        SECURE_HSTS_INCLUDE_SUBDOMAINS='True',
        SECURE_HSTS_PRELOAD='True',
    )

    assert result.returncode == 0, result.stderr
    assert 'WARNING' not in result.stderr
