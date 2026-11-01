"""Optional pytest plugin to replay HTTP checks against original viewsets.

Example: python -m pytest -p core.tests.baseline_routes --baseline-ref=f0fc4670
core/tests/test_workflow_http.py

Only the test process router changes. Source files and the local database do not.
"""
from pathlib import Path
import subprocess


def pytest_addoption(parser):
    parser.addoption('--baseline-ref', required=True, help='Git revision containing the original views')


def pytest_configure(config):
    import django
    django.setup()
    from django.urls import clear_url_caches, include, path
    from rest_framework.routers import DefaultRouter
    from core import urls

    root = Path(__file__).resolve().parents[3]
    original_classes = {}
    for module in ('employee', 'leave', 'loan', 'payroll', 'recruitment'):
        source = subprocess.check_output(
            ['git', 'show', f'{config.getoption("baseline_ref")}:backend/core/views/{module}.py'],
            cwd=root, encoding='utf-8',
        )
        namespace = {'__name__': f'core.views._baseline_{module}', '__package__': 'core.views'}
        exec(compile(source, f'<baseline {module}>', 'exec'), namespace)
        original_classes.update({name: value for name, value in namespace.items()
                                 if name.endswith('ViewSet')})
    router = DefaultRouter()
    for prefix, viewset, basename in urls.router.registry:
        router.register(prefix, original_classes.get(viewset.__name__, viewset), basename=basename)
    urls.urlpatterns[0] = path('', include(router.urls))
    clear_url_caches()
